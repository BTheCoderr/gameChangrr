import React from 'react';
import './PropertyDetailsPanel.css';

const PropertyDetailsPanel = ({ isVisible, onClose, property }) => {
  if (!isVisible || !property) return null;

  const {
    address,
    city,
    state,
    zipCode,
    ownerOccupied,
    propertyType,
    ownerName,
    equity,
    income,
    squareFeet,
    yearBuilt,
    previousAddress,
    age,
    email,
    mobile,
    onDncList
  } = property;

  const handleAction = (action) => {
    console.log(`Action ${action} for property ${address}`);
    // Implement action handling
  };

  return (
    <div className="property-details-panel">
      <div className="panel-header">
        <div className="address-info">
          <h2>{address}</h2>
          <p>{city}, {state} {zipCode}</p>
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="property-tags">
        {ownerOccupied && <span className="tag owner-occupied">Owner Occupied</span>}
        <span className="tag property-type">{propertyType}</span>
      </div>

      <div className="owner-section">
        <h3>{ownerName}</h3>
        <div className="property-stats">
          <div className="stat">
            <span className="label">Equity</span>
            <span className="value">${equity?.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Income</span>
            <span className="value">${income?.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="label">Square Feet</span>
            <span className="value">{squareFeet?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="property-history">
        <div className="history-item">
          <span className="label">Built</span>
          <span className="value">{yearBuilt}</span>
        </div>
        {previousAddress && (
          <div className="history-item">
            <span className="label">Previous Address</span>
            <span className="value">{previousAddress}</span>
          </div>
        )}
      </div>

      <div className="contact-info">
        <div className="contact-row">
          <div className="contact-item">
            <span className="label">Age</span>
            <span className="value">{age} years old</span>
          </div>
          <div className="contact-item">
            <span className="label">Email</span>
            <span className="value">{email}</span>
          </div>
        </div>
        <div className="contact-row">
          <div className="contact-item">
            <span className="label">Mobile</span>
            <span className="value">{mobile}</span>
          </div>
          <div className="contact-item">
            <span className={`dnc-status ${onDncList ? 'on-dnc' : 'not-on-dnc'}`}>
              {onDncList ? 'On DNC List' : 'Not on DNC List'}
            </span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="action-button not-interested"
          onClick={() => handleAction('not-interested')}
        >
          Not Interested
        </button>
        <button 
          className="action-button to-visit"
          onClick={() => handleAction('to-visit')}
        >
          To Visit
        </button>
        <button 
          className="action-button go-back"
          onClick={() => handleAction('go-back')}
        >
          Go Back
        </button>
        <button 
          className="action-button appointment"
          onClick={() => handleAction('appointment')}
        >
          Appointment Set
        </button>
      </div>
    </div>
  );
};

export default PropertyDetailsPanel; 