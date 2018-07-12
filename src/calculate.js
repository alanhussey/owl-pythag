import { flatMap, sum, sortBy } from "lodash";

function getExponent(pointsFor, pointsAgainst, totalMatches) {
  return Math.pow((pointsFor + pointsAgainst) / totalMatches, 0.287);
}

function pythagoreanExpectation(pointsFor, pointsAgainst, exponent) {
  return (
    Math.pow(pointsFor, exponent) /
    (Math.pow(pointsFor, exponent) + Math.pow(pointsAgainst, exponent))
  );
}

export function getTeams(allStages, options = {}) {
  const {
    includePreseason = false,
    includePlayoffs = false,
    usePoints = false,
    recalculateExponent,
    exponent
  } = options;

  const stages = includePreseason
    ? allStages
    : allStages.filter(stage => stage.slug !== "preseason");

  const allMatches = flatMap(stages, stage => stage.matches);

  const matches = allMatches.filter(match => {
    return (
      match.status === "CONCLUDED" &&
      match.games.every(game => game.status === "CONCLUDED") &&
      (match.tournament.type === "OPEN_MATCHES" || includePlayoffs)
    );
  });

  const teams = {};
  matches.forEach(match => {
    match.competitors.forEach(team => {
      if (!(team.handle in teams)) {
        teams[team.handle] = {
          info: team,
          matches: [],
          pythagorean: null
        };
      }
      teams[team.handle].matches.push(match);
    });
  });

  Object.values(teams).forEach(team => {
    if (team.pythagorean == null) {
      team.pythagorean = {
        matchesWon: 0,
        matchesLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        pointsEarned: 0,
        pointsAllowed: 0
      };
    }

    team.matches.forEach(match => {
      const scores = match.scores.map(score => score.value);

      // Is this team listed first or second when points are presented?
      const teamIndex = match.competitors.map(c => c.id).indexOf(team.info.id);
      const otherTeamIndex = teamIndex === 0 ? 1 : 0;

      team.pythagorean.pointsEarned += sum(
        match.games.map(game => {
          if (!game.points) {
            debugger;
          }
          return game.points[teamIndex];
        })
      );
      team.pythagorean.pointsAllowed += sum(
        match.games.map(game => game.points[otherTeamIndex])
      );

      if (match.winner.id === team.info.id) {
        team.pythagorean.matchesWon += 1;

        team.pythagorean.gamesWon += Math.max(...scores);
        team.pythagorean.gamesLost += Math.min(...scores);
      } else {
        team.pythagorean.matchesLost += 1;

        team.pythagorean.gamesWon += Math.min(...scores);
        team.pythagorean.gamesLost += Math.max(...scores);
      }
    });
  });

  return sortBy(
    Object.values(teams),
    team => -(team.pythagorean.matchesWon - team.pythagorean.matchesLost)
  ).map(team => {
    const {
      info: { name },
      pythagorean: {
        gamesWon,
        gamesLost,
        matchesWon,
        matchesLost,
        pointsEarned,
        pointsAllowed
      }
    } = team;

    const totalMatches = matchesWon + matchesLost;

    let exponent_, expectedPercentage;
    if (usePoints) {
      exponent_ = recalculateExponent
        ? getExponent(pointsEarned, pointsAllowed, totalMatches)
        : exponent;
      expectedPercentage = pythagoreanExpectation(
        pointsEarned,
        pointsAllowed,
        exponent_
      );
    } else {
      exponent_ = recalculateExponent
        ? getExponent(gamesWon, gamesLost, totalMatches)
        : exponent;
      expectedPercentage = pythagoreanExpectation(
        gamesWon,
        gamesLost,
        exponent_
      );
    }

    const expectedWins = expectedPercentage * totalMatches;

    return {
      team,
      name,
      totalMatches,
      matchesWon,
      matchesLost,
      expectedPercentage,
      expectedWins,
      gamesWon,
      gamesLost,
      pointsEarned,
      pointsAllowed
    };
  });
}
