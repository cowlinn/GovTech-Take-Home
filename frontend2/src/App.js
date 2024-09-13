import React, { useState } from 'react';
import api from './services/api';

function App() {
  const [teamData, setTeamData] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const lines = teamData.split('\n').filter(line => line.trim() !== ""); // Remove empty lines
    const teams = lines.map(line => {
      const parts = line.trim().split(/\s+/); // Split by any number of spaces
      if (parts.length === 3) {
        const [name, registrationDate, groupNumber] = parts;
        return { name, registrationDate, groupNumber: parseInt(groupNumber, 10) };
      } else {
        setMessage('Invalid input format');
        //end the method
      }
      
      return null;
    }).filter(team => team !== null); // Remove any null entries
  
    try {
      console.log(teams);
      const response = await api.post('/teams/', teams);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Failed to add teams');
    }
  };

  return (
    <div>
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
  );
}

export default App;
