import React, { useState } from 'react';
import './StatsPanel.css';

const StatsPanel = ({ isVisible, onClose }) => {
  const [timeRange, setTimeRange] = useState('week');

  const mockData = {
    week: [
      { name: 'John Smith', status: 'active', leads: 45, appointments: 12, closes: 8 },
      { name: 'Sarah Johnson', status: 'active', leads: 38, appointments: 10, closes: 6 },
      { name: 'Mike Wilson', status: 'away', leads: 32, appointments: 8, closes: 5 }
    ],
    month: [
      { name: 'Sarah Johnson', status: 'active', leads: 156, appointments: 42, closes: 24 },
      { name: 'John Smith', status: 'active', leads: 142, appointments: 38, closes: 22 },
      { name: 'Mike Wilson', status: 'away', leads: 128, appointments: 34, closes: 18 }
    ]
  };

  if (!isVisible) return null;

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h2>Team Performance</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="time-range-selector">
        <button 
          className={`time-button ${timeRange === 'week' ? 'active' : ''}`}
          onClick={() => setTimeRange('week')}
        >
          This Week
        </button>
        <button 
          className={`time-button ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          This Month
        </button>
      </div>

      <div className="stats-content">
        <div className="leaderboard">
          {mockData[timeRange].map((user, index) => (
            <div key={user.name} className="leaderboard-item">
              <div className="user-info">
                <span className="rank">#{index + 1}</span>
                <span className="name">{user.name}</span>
                <span className={`status ${user.status}`}>{user.status}</span>
              </div>
              <div className="metrics">
                <div className="metric">
                  <span className="label">Leads</span>
                  <span className="value">{user.leads}</span>
                </div>
                <div className="metric">
                  <span className="label">Appointments</span>
                  <span className="value">{user.appointments}</span>
                </div>
                <div className="metric">
                  <span className="label">Closes</span>
                  <span className="value">{user.closes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsPanel; 