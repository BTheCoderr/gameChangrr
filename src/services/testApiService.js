const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5174';

export const testApiService = {
  // Test Account Management
  async createTestAccount(accountData) {
    const response = await fetch(`${API_BASE_URL}/api/test/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountData)
    });
    return response.json();
  },

  async updateTestAccount(accountId, accountData) {
    const response = await fetch(`${API_BASE_URL}/api/test/accounts/${accountId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(accountData)
    });
    return response.json();
  },

  // Test Connection Management
  async createTestConnection(connectionData) {
    const response = await fetch(`${API_BASE_URL}/api/test/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(connectionData)
    });
    return response.json();
  },

  async updateTestConnection(connectionId, status) {
    const response = await fetch(`${API_BASE_URL}/api/test/connections/${connectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Test Share Management
  async createTestShare(shareData) {
    const response = await fetch(`${API_BASE_URL}/api/test/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shareData)
    });
    return response.json();
  },

  async updateTestShare(shareId, status) {
    const response = await fetch(`${API_BASE_URL}/api/test/shares/${shareId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Test Data Management
  async saveTestData(testData) {
    const response = await fetch(`${API_BASE_URL}/api/test/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    return response.json();
  },

  async getTestData() {
    const response = await fetch(`${API_BASE_URL}/api/test/data`);
    return response.json();
  },

  async clearTestData() {
    const response = await fetch(`${API_BASE_URL}/api/test/data`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Error Simulation
  async simulateError(errorType) {
    const response = await fetch(`${API_BASE_URL}/api/test/simulate-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ errorType })
    });
    return response.json();
  }
}; 