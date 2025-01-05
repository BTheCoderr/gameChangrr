import React from 'react';
import './FiltersPanel.css';

const FiltersPanel = ({ visible, filters, onFiltersChange, onClose }) => {
  const handlePropertyTypeChange = (type) => {
    onFiltersChange({ ...filters, propertyType: type });
  };

  const handlePriceRangeChange = (value, index) => {
    const newRange = [...filters.priceRange];
    newRange[index] = parseInt(value) || 0;
    onFiltersChange({ ...filters, priceRange: newRange });
  };

  const handleYearBuiltChange = (value, index) => {
    const newRange = [...filters.yearBuilt];
    newRange[index] = parseInt(value) || 0;
    onFiltersChange({ ...filters, yearBuilt: newRange });
  };

  // Format price for display
  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price}`;
  };

  return (
    <>
      <div className="filter-section">
        <h3>Property Type</h3>
        <div className="button-group">
          <button 
            className={`filter-button ${filters.propertyType === 'all' ? 'active' : ''}`}
            onClick={() => handlePropertyTypeChange('all')}
          >
            All
          </button>
          <button 
            className={`filter-button ${filters.propertyType === 'residential' ? 'active' : ''}`}
            onClick={() => handlePropertyTypeChange('residential')}
          >
            Residential
          </button>
          <button 
            className={`filter-button ${filters.propertyType === 'commercial' ? 'active' : ''}`}
            onClick={() => handlePropertyTypeChange('commercial')}
          >
            Commercial
          </button>
        </div>
      </div>

      <div className="filter-section">
        <h3>Price Range</h3>
        <div className="range-inputs">
          <div className="input-group">
            <input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) => handlePriceRangeChange(e.target.value, 0)}
              min="0"
              max={filters.priceRange[1]}
              step="10000"
              placeholder="Min"
            />
            <span className="input-label">{formatPrice(filters.priceRange[0])}</span>
          </div>
          <span className="separator">to</span>
          <div className="input-group">
            <input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceRangeChange(e.target.value, 1)}
              min={filters.priceRange[0]}
              step="10000"
              placeholder="Max"
            />
            <span className="input-label">{formatPrice(filters.priceRange[1])}</span>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3>Year Built</h3>
        <div className="range-inputs">
          <div className="input-group">
            <input
              type="number"
              value={filters.yearBuilt[0]}
              onChange={(e) => handleYearBuiltChange(e.target.value, 0)}
              min="1800"
              max={filters.yearBuilt[1]}
              placeholder="From"
            />
          </div>
          <span className="separator">to</span>
          <div className="input-group">
            <input
              type="number"
              value={filters.yearBuilt[1]}
              onChange={(e) => handleYearBuiltChange(e.target.value, 1)}
              min={filters.yearBuilt[0]}
              max={new Date().getFullYear()}
              placeholder="To"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FiltersPanel; 