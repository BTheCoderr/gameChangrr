import { PermitsLayer } from './PermitsLayer';
import { fetchPermits } from '../../../services/permitService';

export class HVACPermitsLayer extends PermitsLayer {
  constructor(map) {
    super(map, 'hvac');
  }

  async loadData() {
    try {
      const bounds = this.map.getBounds();
      const data = await fetchPermits('hvac', {
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
      console.error('Error loading HVAC permit data:', error);
    }
  }

  getPointColor() {
    return '#2196F3';
  }

  getPopupContent(properties) {
    const date = new Date(properties.issueDate).toLocaleDateString();
    const status = properties.status.charAt(0).toUpperCase() + properties.status.slice(1);
    
    return `
      <h3>HVAC Permit</h3>
      <p>
        <strong>Status:</strong> ${status}<br>
        <strong>Issue Date:</strong> ${date}<br>
        <strong>Address:</strong> ${properties.address}<br>
        <strong>Contractor:</strong> ${properties.contractor}<br>
        <strong>System Type:</strong> ${properties.systemType}<br>
        <strong>Value:</strong> $${properties.value.toLocaleString()}<br>
        ${properties.notes ? `<strong>Notes:</strong> ${properties.notes}` : ''}
      </p>
    `;
  }
} 