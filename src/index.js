import React from 'react';
import ReactDOM from 'react-dom';
import './sass/global.scss';
import App from './App';
import { UserProvider } from './context/user.js';

ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
