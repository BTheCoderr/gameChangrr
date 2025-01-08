import mapboxgl from 'mapbox-gl';
import { fetchUtilityData, getUtilityBoundaryStyle, formatRate, getProgramDetails } from '../../../services/utilityService';

export class UtilityBoundariesLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = 'utility-boundaries';
    this.layerIds = {
      fill: 'utility-boundaries-fill',
      outline: 'utility-boundaries-outline',
      highlight: 'utility-boundaries-highlight',
      label: 'utility-boundaries-label'
    };
    this.hoveredStateId = null;
    this.visible = true;
    this.opacity = 0.7;
  }

  async initialize() {
    try {
      // Add source with generateId for stable feature states
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        generateId: true,
        promoteId: 'id'
      });

      // Add fill layer with improved styling
      this.map.addLayer({
        id: this.layerIds.fill,
        type: 'fill',
        source: this.sourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, ['*', ['get', 'opacity'], 0.4],
            12, ['*', ['get', 'opacity'], this.opacity]
          ],
          'fill-antialias': true
        }
      });

      // Add outline layer with improved styling
      this.map.addLayer({
        id: this.layerIds.outline,
        type: 'line',
        source: this.sourceId,
        paint: {
          'line-color': ['get', 'borderColor'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 1,
            12, 2,
            16, 3
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.8
          ],
          'line-blur': 0.5
        }
      });

      // Add highlight layer for hover effect
      this.map.addLayer({
        id: this.layerIds.highlight,
        type: 'line',
        source: this.sourceId,
        paint: {
          'line-color': '#FFFFFF',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 2,
            12, 3,
            16, 4
          ],
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.8,
            0
          ],
          'line-blur': 1
        }
      });

      // Add label layer with improved text rendering
      this.map.addLayer({
        id: this.layerIds.label,
        type: 'symbol',
        source: this.sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 10,
            12, 12,
            16, 14
          ],
          'text-anchor': 'center',
          'text-justify': 'center',
          'text-offset': [0, 0],
          'text-optional': true,
          'symbol-placement': 'point',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold']
        },
        paint: {
          'text-color': '#333333',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0,
            9, 1
          ]
        }
      });

      this.addInteractions();
      await this.loadData();
    } catch (error) {
      console.error('Error initializing UtilityBoundariesLayer:', error);
      throw error;
    }
  }

  addInteractions() {
    // Mouse enter with tooltip
    this.map.on('mouseenter', this.layerIds.fill, (e) => {
      this.map.getCanvas().style.cursor = 'pointer';
      if (e.features.length > 0) {
        if (this.hoveredStateId !== null) {
          this.map.setFeatureState(
            { source: this.sourceId, id: this.hoveredStateId },
            { hover: false }
          );
        }
        this.hoveredStateId = e.features[0].id;
        this.map.setFeatureState(
          { source: this.sourceId, id: this.hoveredStateId },
          { hover: true }
        );

        // Show tooltip
        const { properties } = e.features[0];
        const tooltipContent = `
          <div class="utility-tooltip">
            <strong>${properties.name}</strong>
            <div class="rate-info">
              Rate: ${formatRate(properties.rates?.residential?.base || 0)}/kWh
            </div>
          </div>
        `;

        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'utility-tooltip-popup',
          maxWidth: '300px'
        })
          .setLngLat(e.lngLat)
          .setHTML(tooltipContent)
          .addTo(this.map);
      }
    });

    // Mouse leave
    this.map.on('mouseleave', this.layerIds.fill, () => {
      this.map.getCanvas().style.cursor = '';
      if (this.hoveredStateId !== null) {
        this.map.setFeatureState(
          { source: this.sourceId, id: this.hoveredStateId },
          { hover: false }
        );
      }
      this.hoveredStateId = null;
      
      // Remove tooltip
      const tooltips = document.getElementsByClassName('utility-tooltip-popup');
      Array.from(tooltips).forEach(tooltip => tooltip.remove());
    });

    // Click for detailed popup
    this.map.on('click', this.layerIds.fill, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        this.showDetailedPopup(feature, e.lngLat);
      }
    });
  }

  showDetailedPopup(feature, lngLat) {
    const { properties } = feature;
    const program = getProgramDetails(properties);
    
    const content = `
      <div class="utility-popup">
        <div class="utility-popup-header">
          <h3>${properties.name}</h3>
          <div class="service-area">${properties.serviceArea}</div>
        </div>
        
        <div class="utility-popup-content">
          <div class="rates-section">
            <h4>Current Rates</h4>
            <table class="rates-table">
              <tr>
                <th>Type</th>
                <th>Base</th>
                <th>Peak</th>
                <th>Off-Peak</th>
              </tr>
              <tr>
                <td>Residential</td>
                <td>${formatRate(properties.rates?.residential?.base)}</td>
                <td>${formatRate(properties.rates?.residential?.peak)}</td>
                <td>${formatRate(properties.rates?.residential?.offPeak)}</td>
              </tr>
              <tr>
                <td>Commercial</td>
                <td>${formatRate(properties.rates?.commercial?.base)}</td>
                <td>${formatRate(properties.rates?.commercial?.peak)}</td>
                <td>${formatRate(properties.rates?.commercial?.offPeak)}</td>
              </tr>
            </table>
          </div>

          <div class="stats-section">
            <h4>Service Statistics</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <label>Total Customers</label>
                <value>${properties.stats?.totalCustomers?.toLocaleString()}</value>
              </div>
              <div class="stat-item">
                <label>Avg. Monthly Bill</label>
                <value>${formatRate(properties.stats?.avgBill)}</value>
              </div>
              <div class="stat-item">
                <label>Solar Adoption</label>
                <value>${properties.stats?.solarAdoption}%</value>
              </div>
            </div>
          </div>

          ${program ? `
            <div class="program-section">
              <h4>Solar Program Details</h4>
              <div class="program-details">
                <div class="program-name">${program.name}</div>
                <div class="program-info">
                  <div>Incentive Rate: ${formatRate(program.incentiveRate)}</div>
                  <div>Max System Size: ${program.maxCapacity}kW</div>
                  <div>Status: ${program.enrollmentStatus}</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      className: 'utility-detailed-popup',
      maxWidth: '400px',
      offset: 15
    })
      .setLngLat(lngLat)
      .setHTML(content)
      .addTo(this.map);
  }

  async loadData() {
    try {
      const bounds = this.map.getBounds();
      const data = await fetchUtilityData({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      if (!data || !data.features || data.features.length === 0) {
        console.warn('No utility boundary data available');
        return;
      }

      const source = this.map.getSource(this.sourceId);
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.error('Error loading utility boundary data:', error);
      throw error;
    }
  }

  setVisibility(visible) {
    this.visible = visible;
    const visibility = visible ? 'visible' : 'none';
    Object.values(this.layerIds).forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
  }

  setOpacity(opacity) {
    this.opacity = opacity;
    
    if (this.map.getLayer(this.layerIds.fill)) {
      this.map.setPaintProperty(
        this.layerIds.fill,
        'fill-opacity',
        ['case',
          ['boolean', ['feature-state', 'hover'], false],
          0.6,
          ['*', ['get', 'opacity'], opacity]
        ]
      );
    }

    if (this.map.getLayer(this.layerIds.outline)) {
      this.map.setPaintProperty(
        this.layerIds.outline,
        'line-opacity',
        opacity
      );
    }

    if (this.map.getLayer(this.layerIds.label)) {
      this.map.setPaintProperty(
        this.layerIds.label,
        'text-opacity',
        opacity
      );
    }
  }

  cleanup() {
    Object.values(this.layerIds).forEach(layerId => {
      if (this.map.getLayer(layerId)) {
        this.map.removeLayer(layerId);
      }
    });

    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId);
    }
  }
} 