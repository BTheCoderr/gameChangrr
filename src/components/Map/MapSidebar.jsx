import React from 'react';
import './MapboxMap.css';

const MapSidebar = ({ activeLayers, onLayerToggle, filters, onFilterChange }) => {
  const handleLayerChange = (layerName) => {
    onLayerToggle({
      ...activeLayers,
      [layerName]: !activeLayers[layerName]
    });
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const parseDateInput = (value) => {
    const [month, day, year] = value.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (index, value) => {
    const newDates = [...filters.dateRange];
    newDates[index] = parseDateInput(value);
    handleFilterChange('dateRange', newDates);
  };

  return (
    <div className="map-sidebar">
      <h2>Map Layers</h2>
      
      <div className="layer-group">
        <div className="layer-toggle">
          <input
            type="checkbox"
            id="move-ins"
            checked={activeLayers.moveIns}
            onChange={() => handleLayerChange('moveIns')}
          />
          <label htmlFor="move-ins">Move-ins</label>
        </div>

        <div className="layer-toggle">
          <input
            type="checkbox"
            id="neighborhood-insights"
            checked={activeLayers.neighborhoodInsights}
            onChange={() => handleLayerChange('neighborhoodInsights')}
          />
          <label htmlFor="neighborhood-insights">Neighborhood Insights</label>
        </div>

        <div className="layer-toggle">
          <input
            type="checkbox"
            id="solar-installations"
            checked={activeLayers.solarInstallations}
            onChange={() => handleLayerChange('solarInstallations')}
          />
          <label htmlFor="solar-installations">Solar Installations</label>
        </div>
      </div>

      <div className="filter-group">
        <h3>Filters</h3>
        
        <div className="property-type">
          <h4>Property Type</h4>
          <div className="layer-toggle">
            <input
              type="radio"
              id="all"
              name="propertyType"
              value="all"
              checked={filters.propertyType === 'all'}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            />
            <label htmlFor="all">All</label>
          </div>
          <div className="layer-toggle">
            <input
              type="radio"
              id="residential"
              name="propertyType"
              value="residential"
              checked={filters.propertyType === 'residential'}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            />
            <label htmlFor="residential">Residential</label>
          </div>
          <div className="layer-toggle">
            <input
              type="radio"
              id="commercial"
              name="propertyType"
              value="commercial"
              checked={filters.propertyType === 'commercial'}
              onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            />
            <label htmlFor="commercial">Commercial</label>
          </div>
        </div>

        <div className="price-range">
          <h4>Price Range</h4>
          <div className="range-slider">
            <div className="range-values">
              <span>${filters.priceRange[0].toLocaleString()}</span>
              <span>${filters.priceRange[1].toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000000"
              step="10000"
              value={filters.priceRange[1]}
              onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
            />
          </div>
        </div>

        <div className="year-built">
          <h4>Year Built</h4>
          <div className="range-slider">
            <div className="range-values">
              <span>{filters.yearBuilt[0]}</span>
              <span>{filters.yearBuilt[1]}</span>
            </div>
            <input
              type="range"
              min="1900"
              max="2024"
              value={filters.yearBuilt[1]}
              onChange={(e) => handleFilterChange('yearBuilt', [filters.yearBuilt[0], parseInt(e.target.value)])}
            />
          </div>
        </div>

        <div className="move-in-date">
          <h4>Move-in Date Range</h4>
          <div className="date-range">
            <input
              type="text"
              value={formatDate(filters.dateRange[0])}
              onChange={(e) => handleDateChange(0, e.target.value)}
              placeholder="MM/DD/YYYY"
            />
            <input
              type="text"
              value={formatDate(filters.dateRange[1])}
              onChange={(e) => handleDateChange(1, e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </div>
        </div>

        <div className="solar-capacity">
          <h4>Solar Capacity (kW)</h4>
          <div className="range-slider">
            <div className="range-values">
              <span>{filters.capacityRange[0]}</span>
              <span>{filters.capacityRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={filters.capacityRange[1]}
              onChange={(e) => handleFilterChange('capacityRange', [filters.capacityRange[0], parseInt(e.target.value)])}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapSidebar; 