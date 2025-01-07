import React, { useState, useEffect } from 'react';
import { TestDataGenerator } from './TestDataGenerator';
import { testApiService } from '../../services/testApiService';
import './TestConnectionManager.css';

export const TestConnectionManager = () => {
  const [connections, setConnections] = useState([]);
  const [shares, setShares] = useState([]);
  const [accountSettings, setAccountSettings] = useState({
    isTestAccount: false,
    supportedMeterTypes: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved preferences and sync with backend
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load from localStorage first for immediate UI update
        const savedSettings = localStorage.getItem('testAccountSettings');
        if (savedSettings) {
          setAccountSettings(JSON.parse(savedSettings));
        }
        
        const savedConnections = localStorage.getItem('testConnections');
        if (savedConnections) {
          setConnections(JSON.parse(savedConnections));
        }
        
        const savedShares = localStorage.getItem('testShares');
        if (savedShares) {
          setShares(JSON.parse(savedShares));
        }

        // Then sync with backend
        const account = await testApiService.createTestAccount(JSON.parse(savedSettings || '{}'));
        setAccountSettings(prev => ({ ...prev, id: account.id }));

      } catch (error) {
        console.error('Error loading test settings:', error);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save settings to localStorage and backend when they change
  useEffect(() => {
    const saveData = async () => {
      try {
        // Save to localStorage
        localStorage.setItem('testAccountSettings', JSON.stringify(accountSettings));
        localStorage.setItem('testConnections', JSON.stringify(connections));
        localStorage.setItem('testShares', JSON.stringify(shares));

        // Sync with backend
        if (accountSettings.id) {
          await testApiService.updateTestAccount(accountSettings.id, accountSettings);
        }
      } catch (error) {
        console.error('Error saving test settings:', error);
        setError('Failed to save settings. Please try again.');
      }
    };

    saveData();
  }, [accountSettings, connections, shares]);

  const handleEnableTestAccount = async () => {
    try {
      setLoading(true);
      const account = await testApiService.createTestAccount({
        ...accountSettings,
        isTestAccount: true
      });

      setAccountSettings(prev => ({
        ...prev,
        id: account.id,
        isTestAccount: true
      }));

      setError(null);
    } catch (error) {
      console.error('Error enabling test account:', error);
      setError('Failed to enable test account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeterTypes = async (meterTypes) => {
    try {
      setLoading(true);
      await testApiService.updateTestAccount(accountSettings.id, {
        ...accountSettings,
        supportedMeterTypes: meterTypes
      });

      setAccountSettings(prev => ({
        ...prev,
        supportedMeterTypes: meterTypes
      }));

      setError(null);
    } catch (error) {
      console.error('Error updating meter types:', error);
      setError('Failed to update meter types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (connection) => {
    try {
      setLoading(true);
      const newConnection = await testApiService.createTestConnection({
        ...connection,
        accountId: accountSettings.id
      });

      setConnections(prev => [...prev, newConnection]);
      setError(null);
    } catch (error) {
      console.error('Error adding connection:', error);
      setError('Failed to add connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionStatus = async (connectionId, status) => {
    try {
      setLoading(true);
      await testApiService.updateTestConnection(connectionId, status);

      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status }
          : conn
      ));

      setError(null);
    } catch (error) {
      console.error(`Error ${status}ing connection:`, error);
      setError(`Failed to ${status} connection. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddShare = async (share) => {
    try {
      setLoading(true);
      const newShare = await testApiService.createTestShare({
        ...share,
        accountId: accountSettings.id
      });

      setShares(prev => [...prev, newShare]);
      setError(null);
    } catch (error) {
      console.error('Error adding share:', error);
      setError('Failed to add share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareStatus = async (shareId, status) => {
    try {
      setLoading(true);
      await testApiService.updateTestShare(shareId, status);

      setShares(prev => prev.map(share => 
        share.id === shareId 
          ? { ...share, status }
          : share
      ));

      setError(null);
    } catch (error) {
      console.error(`Error ${status}ing share:`, error);
      setError(`Failed to ${status} share. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="test-connection-manager">
      <h2>Test Environment Manager</h2>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {/* Account Settings Section */}
      <section className="account-settings">
        <h3>Account Settings</h3>
        <div className="settings-controls">
          <label>
            <input
              type="checkbox"
              checked={accountSettings.isTestAccount}
              onChange={() => handleEnableTestAccount()}
              disabled={loading}
            />
            Enable Test Environment
          </label>
          
          {accountSettings.isTestAccount && (
            <div className="meter-types">
              <h4>Supported Meter Types</h4>
              <div className="meter-type-options">
                {['Electric', 'Gas', 'Water', 'Steam'].map(type => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={accountSettings.supportedMeterTypes.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked
                          ? [...accountSettings.supportedMeterTypes, type]
                          : accountSettings.supportedMeterTypes.filter(t => t !== type);
                        handleUpdateMeterTypes(newTypes);
                      }}
                      disabled={loading}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Test Data Generator Section */}
      <TestDataGenerator />

      {/* Connections Section */}
      <section className="connections">
        <h3>Test Connections</h3>
        <button 
          onClick={() => handleAddConnection({ 
            name: 'Test Customer ' + (connections.length + 1),
            type: 'customer'
          })}
          disabled={loading || !accountSettings.isTestAccount}
        >
          Add Test Connection
        </button>
        
        <div className="connections-list">
          {connections.map(conn => (
            <div key={conn.id} className={`connection-item ${conn.status}`}>
              <span>{conn.name}</span>
              <span className="status">{conn.status}</span>
              {conn.status === 'pending' && (
                <div className="actions">
                  <button 
                    onClick={() => handleConnectionStatus(conn.id, 'accepted')}
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleConnectionStatus(conn.id, 'rejected')}
                    disabled={loading}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Shares Section */}
      <section className="shares">
        <h3>Test Shares</h3>
        <button 
          onClick={() => handleAddShare({ 
            name: 'Test Share ' + (shares.length + 1),
            type: 'property'
          })}
          disabled={loading || !accountSettings.isTestAccount}
        >
          Add Test Share
        </button>
        
        <div className="shares-list">
          {shares.map(share => (
            <div key={share.id} className={`share-item ${share.status}`}>
              <span>{share.name}</span>
              <span className="status">{share.status}</span>
              {share.status === 'pending' && (
                <div className="actions">
                  <button 
                    onClick={() => handleShareStatus(share.id, 'accepted')}
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleShareStatus(share.id, 'rejected')}
                    disabled={loading}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}; 