import React from 'react';
import './App.scss';
import { Logger, LogLevel } from './Logger';
import MynSweepr from './MynSweepr';

const App: React.FC = () => {
  Logger.level = LogLevel.Log;
  return <MynSweepr></MynSweepr>;
};

export default App;
