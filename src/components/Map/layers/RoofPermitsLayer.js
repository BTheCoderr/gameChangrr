import { PermitsLayer } from './PermitsLayer';
import { fetchPermits } from '../../../services/permitService';

export class RoofPermitsLayer extends PermitsLayer {
  constructor(map) {
    super(map, 'roof');
  }

  async loadData() {
    try {
      const bounds = this.map.getBounds();
      const data = await fetchPermits('roof', {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      const source = this.map.getSource(this.sourceId);
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.error('Error loading roof permit data:', error);
    }
  }

  getPointColor() {
    return '#4CAF50';
  }

  getPopupContent(properties) {
    const date = new Date(properties.issueDate).toLocaleDateString();
    const status = properties.status.charAt(0).toUpperCase() + properties.status.slice(1);
    
    return `
      <h3>Roof Permit</h3>
      <p>
        <strong>Status:</strong> ${status}<br>
        <strong>Issue Date:</strong> ${date}<br>
        <strong>Address:</strong> ${properties.address}<br>
        <strong>Contractor:</strong> ${properties.contractor}<br>
        <strong>Value:</strong> $${properties.value.toLocaleString()}<br>
        ${properties.notes ? `<strong>Notes:</strong> ${properties.notes}` : ''}
      </p>
    `;
  }
} 