import React, { Component } from "react";
import Table from './Table';
import "./App.css";


class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">
            Overwatch League – Pythagorean Expectation
          </h1>
          <p className="App-intro">
            Calculating <a href="https://en.wikipedia.org/wiki/Pythagorean_expectation">Pythagorean expectation</a> for Overwatch League teams.
          </p>
        </header>
        <Table />
      </div>
    );
  }
}

export default App;
