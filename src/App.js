import React, { Component } from 'react';
import Proxy from './proxy';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <span role="img" aria-label="logo" className="App-logo">🌉</span>
          <h1 className="App-title">Virtual Gesher Plada</h1>
        </header>
        <div className="App-content">
          <Proxy/>
        </div>
      </div>
    );
  }
}

export default App;
