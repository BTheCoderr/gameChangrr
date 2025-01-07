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
    this.opacity = 1;
  }

  async initialize() {
    try {
      // Add source
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        generateId: true
      });

      // Add fill layer
      this.map.addLayer({
        id: this.layerIds.fill,
        type: 'fill',
        source: this.sourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            ['*', ['get', 'opacity'], this.opacity]
          ]
        }
      });

      // Add outline layer
      this.map.addLayer({
        id: this.layerIds.outline,
        type: 'line',
        source: this.sourceId,
        paint: {
          'line-color': ['get', 'borderColor'],
          'line-width': ['case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            2
          ],
          'line-opacity': this.opacity
        }
      });

      // Add highlight layer
      this.map.addLayer({
        id: this.layerIds.highlight,
        type: 'line',
        source: this.sourceId,
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1,
          'line-opacity': ['case',
            ['boolean', ['feature-state', 'hover'], false],
            0.8,
            0
          ]
        }
      });

      // Add label layer
      this.map.addLayer({
        id: this.layerIds.label,
        type: 'symbol',
        source: this.sourceId,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-justify': 'center',
          'text-offset': [0, 0],
          'text-optional': true,
          'symbol-placement': 'point',
          'text-allow-overlap': false,
          'text-ignore-placement': false
        },
        paint: {
          'text-color': '#333333',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5,
          'text-opacity': this.opacity
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
    // Mouse enter
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
    });

    // Click
    this.map.on('click', this.layerIds.fill, (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        this.showPopup(feature, e.lngLat);
      }
    });
  }

  showPopup(feature, lngLat) {
    const { properties } = feature;
    const program = getProgramDetails(properties);
    
    const content = `
      <div class="popup-content">
        <h3>${properties.name}</h3>
        <div class="popup-section">
          <h4>Service Area</h4>
          <p>${properties.serviceArea}</p>
        </div>
        <div class="popup-section">
          <h4>Rates</h4>
          <table>
            <tr>
              <th>Type</th>
              <th>Base</th>
              <th>Peak</th>
              <th>Off-Peak</th>
            </tr>
            <tr>
              <td>Residential</td>
              <td>${formatRate(properties.rates.residential.base)}</td>
              <td>${formatRate(properties.rates.residential.peak)}</td>
              <td>${formatRate(properties.rates.residential.offPeak)}</td>
            </tr>
            <tr>
              <td>Commercial</td>
              <td>${formatRate(properties.rates.commercial.base)}</td>
              <td>${formatRate(properties.rates.commercial.peak)}</td>
              <td>${formatRate(properties.rates.commercial.offPeak)}</td>
            </tr>
          </table>
        </div>
        <div class="popup-section">
          <h4>Statistics</h4>
          <ul>
            <li>Total Customers: ${properties.stats.totalCustomers}</li>
            <li>Average Monthly Bill: ${formatRate(properties.stats.avgBill)}</li>
            <li>Solar Adoption Rate: ${properties.stats.solarAdoption}</li>
          </ul>
        </div>
        ${program ? `
          <div class="popup-section">
            <h4>Solar Program</h4>
            <ul>
              <li>Name: ${program.name}</li>
              <li>Incentive Rate: ${formatRate(program.incentiveRate)}</li>
              <li>Max Capacity: ${program.maxCapacity}kW</li>
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    new mapboxgl.Popup()
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