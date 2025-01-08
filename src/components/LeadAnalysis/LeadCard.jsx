import React from 'react';
import './LeadCard.css';

const LeadCard = ({ lead }) => {
  const {
    property,
    score,
    priority,
    factors,
    projectedSavings
  } = lead;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value, decimals = 1) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#4CAF50';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <div className="lead-card">
      <div className="lead-header">
        <div className="lead-title">
          <h3>{property.address}</h3>
          <div 
            className="priority-badge"
            style={{ backgroundColor: getPriorityColor(priority) }}
          >
            {priority.toUpperCase()} PRIORITY
          </div>
        </div>
        <div className="lead-score">
          <div className="score-circle" style={{ borderColor: getPriorityColor(priority) }}>
            {score}
          </div>
          <span>Lead Score</span>
        </div>
      </div>

      <div className="lead-details">
        <div className="detail-section">
          <h4>Property Details</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Property Type</label>
              <span>{property.type}</span>
            </div>
            <div className="detail-item">
              <label>Value</label>
              <span>{formatCurrency(property.value)}</span>
            </div>
            <div className="detail-item">
              <label>Square Feet</label>
              <span>{formatNumber(property.squareFeet)} sf</span>
            </div>
            <div className="detail-item">
              <label>Year Built</label>
              <span>{property.yearBuilt}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Scoring Factors</h4>
          <div className="factors-grid">
            {Object.entries(factors).map(([factor, value]) => (
              <div key={factor} className="factor-item">
                <div className="factor-bar-container">
                  <div 
                    className="factor-bar"
                    style={{ width: `${value}%`, backgroundColor: getPriorityColor(priority) }}
                  />
                </div>
                <label>{factor.replace(/([A-Z])/g, ' $1').trim()}</label>
                <span>{Math.round(value)}%</span>
              </div>
            ))}
          </div>
        </div>

        {projectedSavings && (
          <div className="detail-section">
            <h4>Projected Savings</h4>
            <div className="savings-grid">
              <div className="savings-item">
                <label>Annual Savings</label>
                <span className="savings-value">{formatCurrency(projectedSavings.annualSavings)}</span>
              </div>
              <div className="savings-item">
                <label>System Size</label>
                <span>{formatNumber(projectedSavings.systemSize)} kW</span>
              </div>
              <div className="savings-item">
                <label>Net Cost</label>
                <span>{formatCurrency(projectedSavings.netCost)}</span>
              </div>
              <div className="savings-item">
                <label>ROI</label>
                <span>{formatNumber(projectedSavings.roi)}%</span>
              </div>
              <div className="savings-item">
                <label>Payback Period</label>
                <span>{formatNumber(projectedSavings.paybackPeriod)} years</span>
              </div>
              <div className="savings-item">
                <label>Federal Incentive</label>
                <span>{formatCurrency(projectedSavings.federalIncentive)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lead-actions">
        <button className="action-button primary">Contact Lead</button>
        <button className="action-button secondary">Generate Report</button>
        <button className="action-button secondary">View Details</button>
      </div>
    </div>
  );
};

export default LeadCard; 