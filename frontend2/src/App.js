import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import api from './services/api';
import TeamList from './Components/TeamList';
import './App.css'; // Ensure the path is correct
import EnterTournament from './Components/EnterTournament';
import Constants from './Utilities/Constants';
const { EXPECTED_TEAM_NUMBER, NUMBER_OF_FIELDS } = Constants;

function App() {
  const [teamData, setTeamData] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false); // Track if the user has navigated
  const navigate = useNavigate();

  useEffect(() => {
  
    const savedState = localStorage.getItem('isSubmitted');
    const navigationState = localStorage.getItem('hasNavigated');

    if (!savedState && !navigationState) { //user has cleared cache, probably need to clear everything
      localStorage.removeItem('editResults');
      api.delete('/teams/');
      setMessage('Enter your teams');
      setIsSubmitted(false);
      localStorage.removeItem('isSubmitted');
      localStorage.removeItem('hasNavigated'); // Reset navigation state
      setHasNavigated(false);
    };

    if (savedState === 'true') {
      setIsSubmitted(true);
    }

    if (navigationState === 'true') {
      setHasNavigated(true);
    }
  }, []);

  const handleSubmit = async () => {
    const lines = teamData.split('\n').filter(line => line.trim() !== "");
    var valid_lines = true;
    var error_line = "";
    const teams = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length === NUMBER_OF_FIELDS) {
        const [name, registrationDate, groupNumber] = parts;
        return { name, registrationDate, groupNumber: parseInt(groupNumber, 10) };
      } else {
        error_line = line;
        valid_lines = false;
        return;
      }
    }).filter(team => team !== null);

    if (! valid_lines) {
      setMessage(`Invalid input format for line: ${error_line}`);
      return;
    }
    if (lines.length != EXPECTED_TEAM_NUMBER) {
      setMessage('Error: Please enter exactly 12 teams.');
      return;
    }

    try {
      const response = await api.post('/teams/', teams);
      setMessage(response.data.message);
      setIsSubmitted(true);
      localStorage.setItem('isSubmitted', 'true');
      localStorage.setItem('hasNavigated', 'false'); // Reset navigation state
    } catch (error) {
      setMessage('Failed to add teams');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/teams/');
      setMessage('All teams have been cleared.');
      setIsSubmitted(false);
      localStorage.removeItem('isSubmitted');
      localStorage.removeItem('hasNavigated'); // Reset navigation state
      localStorage.removeItem('editResults'); 
      setHasNavigated(false);
    } catch (error) {
      setMessage('Failed to clear all teams');
    }
  };

  const navigateToTournament = () => {
    localStorage.setItem('hasNavigated', 'true'); // Set navigation state
    setHasNavigated(true);
    navigate('/enterTournament');
  };

  return (
    <div className="container">
      <Routes>
        <Route path="/" element={
          !isSubmitted ? (
            <div className="form-section">
              <h1>Enter Team Information</h1>
              <textarea
                rows="10"
                cols="50"
                value={teamData}
                onChange={(e) => setTeamData(e.target.value)}
              />
              <br />
              <button onClick={handleSubmit}>Submit</button>
              {message && <p>{message}</p>}
            </div>
          ) : (
            <div className="list-section">
              <h3>Teams Added Successfully. Continue to tournament </h3>
              <div className="team-list">
                <TeamList />
              </div>
              <button onClick={handleClearAll} className="clear-button">Clear All</button>
              <button onClick={navigateToTournament} className="navigate-button">Go to Tournament</button>
            </div>
          )
        } />
        <Route path="/enterTournament" element={
          hasNavigated ? (
            <EnterTournament />
          ) : (
            <Navigate to="/" />
          )
        } />
      </Routes>
    </div>
  );
}

export default App;
