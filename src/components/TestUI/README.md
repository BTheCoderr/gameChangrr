# Test UI Components

This directory contains components for managing and testing API integrations in a development environment.

## Components

### TestConnectionManager

A component for managing test API connections and data sharing between accounts.

#### Features:
- Enable/disable test environment
- Configure supported meter types
- Manage test connections
- Handle property and meter sharing
- Persist settings in localStorage

#### Usage:
```jsx
import { TestConnectionManager } from './components/TestUI/TestConnectionManager';

function App() {
  return (
    <div>
      <TestConnectionManager />
    </div>
  );
}
```

### TestDataGenerator

A component for generating realistic test data for solar installations and utility boundaries.

#### Features:
- Generate random solar installation data
- Generate random utility boundary data
- Preview generated data
- Save data to localStorage and backend
- Clear test data

#### Usage:
```jsx
import { TestDataGenerator } from './components/TestUI/TestDataGenerator';

function App() {
  return (
    <div>
      <TestDataGenerator />
    </div>
  );
}
```

## API Integration

The Test UI components integrate with the backend through the `testApiService`. This service provides methods for:

- Creating and updating test accounts
- Managing test connections
- Handling data sharing
- Saving and retrieving test data
- Simulating error conditions

### Example API Usage:
```javascript
import { testApiService } from '../../services/testApiService';

// Create a test account
const account = await testApiService.createTestAccount({
  name: 'Test User',
  email: 'test@example.com'
});

// Create a test connection
const connection = await testApiService.createTestConnection({
  accountId: account.id,
  type: 'customer'
});

// Update connection status
await testApiService.updateTestConnection(connection.id, 'accepted');
```

## Data Persistence

The Test UI uses both localStorage and backend storage:

### localStorage Keys:
- `testAccountSettings`: Account configuration
- `testConnections`: Connection states
- `testShares`: Share states
- `testData`: Generated test data

### Backend Endpoints:
- `/api/test/accounts`: Account management
- `/api/test/connections`: Connection management
- `/api/test/shares`: Share management
- `/api/test/data`: Test data management

## Best Practices

1. **Test Data Generation**
   - Use realistic value ranges
   - Include edge cases
   - Generate diverse data sets

2. **Connection Testing**
   - Test both successful and failed connections
   - Verify proper error handling
   - Test timeout scenarios

3. **Data Sharing**
   - Test different sharing permissions
   - Verify data access controls
   - Test revocation of shares

4. **Error Handling**
   - Test network errors
   - Handle API timeouts
   - Validate error messages

## Environment Configuration

The Test UI requires the following environment variables:

```env
REACT_APP_API_BASE_URL=http://localhost:5174
```

## Contributing

When adding new features to the Test UI:

1. Add appropriate test cases
2. Update documentation
3. Follow the existing code style
4. Test cross-browser compatibility

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Verify API base URL
   - Check network connectivity
   - Confirm CORS settings

2. **Data Generation Issues**
   - Check localStorage quota
   - Verify data format
   - Monitor console for errors

3. **State Management Issues**
   - Clear localStorage
   - Reset connection state
   - Check React dev tools 