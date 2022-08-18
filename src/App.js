import './App.css';
import Demo from './components/Demo/Demo';
import React, { useEffect, useState } from 'react';

function App() {
  const [isVisivle, setIsVisible ] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisivle)
  }

  return <div>
    {isVisivle && <Demo />}
    {!isVisivle && <button onClick={toggleVisibility} className="start">enter</button>}
  </div>
}

export default App;
