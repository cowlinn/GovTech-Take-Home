import React, { useState, useEffect } from 'react';
import api from './services/api';
import TeamList from './Components/TeamList'; // Adjust the path as necessary

function App() {
  const [teamData, setTeamData] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if teams were successfully added

  // Retrieve the submission state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('isSubmitted');
    if (savedState === 'true') {
      setIsSubmitted(true);
    }
  }, []);

  const handleSubmit = async () => {
    const lines = teamData.split('\n').filter(line => line.trim() !== ""); // Remove empty lines
    const teams = lines.map(line => {
      const parts = line.trim().split(/\s+/); // Split by any number of spaces
      if (parts.length === 3) {
        const [name, registrationDate, groupNumber] = parts;
        return { name, registrationDate, groupNumber: parseInt(groupNumber, 10) };
      } else {
        setMessage('Invalid input format');
        return null;
      }
    }).filter(team => team !== null); // Remove any null entries

    if (teams.length !== 12) {
      setMessage('Error: Please enter exactly 12 teams.');
      return; // Exit function if the number of teams is not 12
    }

    try {
      const response = await api.post('/teams/', teams);
      setMessage(response.data.message);
      setIsSubmitted(true); // Set isSubmitted to true on successful submission
      localStorage.setItem('isSubmitted', 'true'); // Save state to localStorage
    } catch (error) {
      setMessage('Failed to add teams');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/teams/'); // Assuming your backend has a delete all endpoint
      setMessage('All teams have been cleared.');
      setIsSubmitted(false); // Optionally, reset the form and display the list
      localStorage.removeItem('isSubmitted'); // Remove the saved state
    } catch (error) {
      setMessage('Failed to clear all teams');
    }
  };

  return (
    <div className="container">
      {!isSubmitted ? ( 
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
          <h2>Teams Added Successfully</h2>
          <TeamList />
          <button onClick={handleClearAll} className="clear-button">Clear All</button>
        </div>
      )}
    </div>
  );
}

export default App;
