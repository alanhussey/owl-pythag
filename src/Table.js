import React, { Component } from "react";
import { getTeams } from "./calculate";

export default class Table extends Component {
  state = {
    stages: null,
    includePreseason: false,
    includePlayoffs: false,
    usePoints: false,
    recalculateExponent: true,
    exponent: 2
  };
  async componentDidMount() {
    const stages = await import("./stages.json");
    this.setState({ stages });
  }

  toggle(option) {
    return () =>
      this.setState(prevState => ({
        ...prevState,
        [option]: !prevState[option]
      }));
  }

  render() {
    const { stages, exponent, ...options } = this.state;

    const teams = stages
      ? getTeams(stages, { ...options, exponent: Number(exponent) })
      : [];

    return (
      <div className="Table">
        <form onSubmit={event => event.preventDefault()}>
          <label>
            <strong>Include</strong>
            <input
              type="checkbox"
              onChange={this.toggle("includePreseason")}
              checked={options.includePreseason}
            />
            preseason matches
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              onChange={this.toggle("includePlayoffs")}
              checked={options.includePlayoffs}
            />
            playoff matches
          </label>

          <br />

          <label>
            <strong>Calculate expected wins using</strong>
            <input
              type="radio"
              onChange={event => this.setState({ usePoints: false })}
              checked={!options.usePoints}
            />
            maps won/lost
          </label>
          <br />
          <label>
            <input
              type="radio"
              onChange={event => this.setState({ usePoints: true })}
              checked={options.usePoints}
            />
            points for/against
          </label>
          <br />

          <label>
            <strong>Exponent term (advanced)</strong>
            <input
              type="radio"
              onChange={event => this.setState({ recalculateExponent: true })}
              checked={options.recalculateExponent}
            />
            Recalculate per-team (<a href="https://en.wikipedia.org/wiki/Pythagenpat">Pythagenpat formula</a>)
          </label>
          <br />
          <label>
            <input
              type="radio"
              onChange={event => this.setState({ recalculateExponent: false })}
              checked={!options.recalculateExponent}
            />
            Use a constant value (
            <input
              type="text"
              style={{width: '2.5em'}}
              value={exponent}
              onChange={event =>
                this.setState({ exponent: event.target.value })
              }
              disabled={options.recalculateExponent}
            />
            )
          </label>
          <br />
        </form>

        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Matches</th>
              <th>Record</th>

              <th>Delta</th>
              <th>Expected</th>

              <th>
                <abbr title="Games (maps) won">GW</abbr>
              </th>
              <th>
                <abbr title="Games (maps) lost">GL</abbr>
              </th>

              <th>
                <abbr title="Points for">PF</abbr>
              </th>
              <th>
                <abbr title="Points against">PA</abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.name}>
                <td style={{ textAlign: "left" }}>{team.name}</td>
                <td style={{ textAlign: "right" }}>{team.totalMatches}</td>
                <td style={{ textAlign: "right" }}>
                  {team.matchesWon} - {team.matchesLost}
                </td>
                <td
                  style={{
                    color:
                      team.expectedWins - team.matchesWon > 0 ? "green" : "red",
                    textAlign: "right"
                  }}
                >
                  {team.expectedWins - team.matchesWon > 0 ? "+" : ""}
                  {(team.expectedWins - team.matchesWon).toFixed(1)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {team.expectedWins.toFixed(1)} -{" "}
                  {(team.totalMatches - team.expectedWins).toFixed(1)}
                </td>
                <td style={{ textAlign: "right" }}>{team.gamesWon}</td>
                <td style={{ textAlign: "right" }}>{team.gamesLost}</td>
                <td style={{ textAlign: "right" }}>{team.pointsEarned}</td>
                <td style={{ textAlign: "right" }}>{team.pointsAllowed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
