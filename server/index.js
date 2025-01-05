import express from 'express';
import cors from 'cors';
import { propertyRouter } from './routes/property.js';

const app = express();
const port = process.env.PORT || 5174;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/property', propertyRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle port in use error
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please try a different port or kill the process using this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 