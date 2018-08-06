import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import 'react-awesome-button/dist/themes/theme-two.css';

ReactDOM.render(<App/>, document.getElementById('root'));

// TODO: This currently doesn't work when compiling electron (and it probably shouldnt work anyway)
//       Just remove this sometime
// import registerServiceWorker from './registerServiceWorker';
// registerServiceWorker();
