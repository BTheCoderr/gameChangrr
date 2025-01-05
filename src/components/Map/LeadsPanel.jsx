import React, { useState } from 'react';
import './LeadsPanel.css';

const LeadsPanel = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('list');

  return (
    <>
      <div className="leads-tabs">
        <button 
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <span className="icon">📋</span> Leads List
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <span className="icon">📊</span> Stats
        </button>
      </div>

      <div className="leads-content">
        {activeTab === 'list' ? (
          <div className="leads-list">
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search by name"
                className="search-input"
              />
            </div>
            <div className="leads-items">
              {/* Leads list items will go here */}
              <div className="no-leads">
                No leads found in this area
              </div>
            </div>
          </div>
        ) : (
          <div className="leads-stats">
            {/* Stats content will go here */}
            <div className="stats-placeholder">
              Stats visualization coming soon
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default LeadsPanel; 