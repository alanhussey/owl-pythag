import React, { Component } from "react";
import { flatMap, sum, sortBy } from "lodash";
import "./App.css";

function getExponent(pointsFor, pointsAgainst, totalMatches) {
  return Math.pow((pointsFor + pointsAgainst) / totalMatches, 0.287);
}

function pythagoreanExpectation(pointsFor, pointsAgainst, exponent) {
  return (
    Math.pow(pointsFor, exponent) /
    (Math.pow(pointsFor, exponent) + Math.pow(pointsAgainst, exponent))
  );
}

function getTeams(allStages, options = {}) {
  const {
    includePreseason = false,
    includePlayoffs = false,
    usePoints = false,
    recalculateExponent,
    exponent,
  } = options;

  const stages = includePreseason
    ? allStages
    : allStages.filter(stage => stage.slug !== "preseason");

  const allMatches = flatMap(stages, stage => stage.matches);

  const matches = allMatches.filter(match => {
    return (
      match.status === "CONCLUDED" &&
      match.games.every(game => game.status === 'CONCLUDED') &&
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
        pointsAllowed: 0,
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
      exponent_ = recalculateExponent ? getExponent(pointsEarned, pointsAllowed, totalMatches) : exponent;
      expectedPercentage = pythagoreanExpectation(
        pointsEarned,
        pointsAllowed,
        exponent_
      );
    } else {
      exponent_ = recalculateExponent ? getExponent(gamesWon, gamesLost, totalMatches) : exponent;
      expectedPercentage = pythagoreanExpectation(
        gamesWon,
        gamesLost,
        exponent_
      );
    }

    const expectedWins = (expectedPercentage * totalMatches);

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

class Table extends Component {
  state = {
    stages: null,
    includePreseason: false,
    includePlayoffs: false,
    usePoints: false,
    recalculateExponent: true,
    exponent: 2,
  };
  async componentDidMount() {
    const stages = await import("./stages.json");
    this.setState({ stages });
  }

  toggle(option) {
    return () => this.setState(prevState => ({
      ...prevState,
      [option]: !prevState[option]
    }));
  }

  render() {
    const { stages, exponent, ...options } = this.state;

    const teams = stages ? getTeams(stages, {...options, exponent: Number(exponent)}) : [];

    return (
      <div className="Table">
        <label>
          <input
            type="checkbox"
            onChange={this.toggle("includePreseason")}
            checked={options.includePreseason}
          />
          Include preseason
        </label>
        <label>
          <input
            type="checkbox"
            onChange={this.toggle("includePlayoffs")}
            checked={options.includePlayoffs}
          />
          Include playoffs
        </label>
        
        <br />
        
        <label>
          <input
            type="checkbox"
            onChange={this.toggle("usePoints")}
            checked={options.usePoints}
          />
          Use total points (instead of maps won/lost)
        </label>

        <br />

        <label>
          <input
            type="radio"
            onChange={event => this.setState({recalculateExponent: true})}
            checked={options.recalculateExponent}
          />
          Recalculate exponent per-team
        </label><br />
        <label>
          <input
            type="radio"
            onChange={event => this.setState({recalculateExponent: false})}
            checked={!options.recalculateExponent}
          />
          use a constant exponent for all teams:
          <label>
            <input
              type="text"
              value={exponent}
              onChange={event => this.setState({exponent: event.target.value})}
              disabled={options.recalculateExponent}
            />
          </label>
        </label><br />
        

        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Matches</th>
              <th>Record</th>

              <th>Delta</th>
              <th>Expected</th>

              <th><abbr title="Games (maps) won">GW</abbr></th>
              <th><abbr title="Games (maps) lost">GL</abbr></th>

              <th><abbr title="Points for">PF</abbr></th>
              <th><abbr title="Points against">PA</abbr></th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.name}>
                <td style={{textAlign: 'left'}}>{team.name}</td>
                <td style={{textAlign: 'right'}}>{team.totalMatches}</td>
                <td style={{textAlign: 'right'}}>
                  {team.matchesWon} - {team.matchesLost}
                </td>
                <td style={{
                  color: (team.expectedWins - team.matchesWon) > 0 ? 'green' : 'red',
                  textAlign: 'right',
                }}>
                  {team.expectedWins - team.matchesWon > 0 ? '+' : ''}{(team.expectedWins - team.matchesWon).toFixed(1)}
                </td>
                <td style={{textAlign: 'right'}}>
                  {team.expectedWins.toFixed(1)} - {(team.totalMatches - team.expectedWins).toFixed(1)}
                </td>
                <td style={{textAlign: 'right'}}>{team.gamesWon}</td>
                <td style={{textAlign: 'right'}}>{team.gamesLost}</td>
                <td style={{textAlign: 'right'}}>{team.pointsEarned}</td>
                <td style={{textAlign: 'right'}}>{team.pointsAllowed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">
            Overwatch League – Pythagorean Expectation
          </h1>
        </header>
        <p className="App-intro">
          Calculating{" "}
          <a href="https://en.wikipedia.org/wiki/Pythagorean_expectation">
            Pythagorean expectation
          </a>{" "}
          for Overwatch League teams.
        </p>
        <Table />
      </div>
    );
  }
}

export default App;
