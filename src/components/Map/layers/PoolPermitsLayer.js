import { PermitsLayer } from './PermitsLayer';
import { fetchPermits } from '../../../services/permitService';

export class PoolPermitsLayer extends PermitsLayer {
  constructor(map) {
    super(map, 'pool');
  }

  async loadData() {
    try {
      const bounds = this.map.getBounds();
      const data = await fetchPermits('pool', {
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
      console.error('Error loading pool permit data:', error);
    }
  }

  getPointColor() {
    return '#00BCD4';
  }

  getPopupContent(properties) {
    const date = new Date(properties.issueDate).toLocaleDateString();
    const status = properties.status.charAt(0).toUpperCase() + properties.status.slice(1);
    
    return `
      <h3>Pool Permit</h3>
      <p>
        <strong>Status:</strong> ${status}<br>
        <strong>Issue Date:</strong> ${date}<br>
        <strong>Address:</strong> ${properties.address}<br>
        <strong>Contractor:</strong> ${properties.contractor}<br>
        <strong>Pool Type:</strong> ${properties.poolType}<br>
        <strong>Size:</strong> ${properties.size} sq ft<br>
        <strong>Value:</strong> $${properties.value.toLocaleString()}<br>
        ${properties.notes ? `<strong>Notes:</strong> ${properties.notes}` : ''}
      </p>
    `;
  }
} 