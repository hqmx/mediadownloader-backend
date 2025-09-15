require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const apiRoutes = require('./routes/api');

class MediaDownloaderServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : true,
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static file serving
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/', apiRoutes);

    // Serve main page for all non-API routes
    this.app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
      } else {
        res.status(404).json({ error: 'API endpoint not found' });
      }
    });
  }

  setupErrorHandling() {
    // JSON parsing error handler
    this.app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
      next();
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message 
      });
    });
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 Media Downloader Server running on port ${this.port}`);
      console.log(`📱 Frontend: http://localhost:${this.port}`);
      console.log(`🔗 API: http://localhost:${this.port}/api`);
      console.log(`❤️ Health: http://localhost:${this.port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));

    return this.server;
  }

  shutdown() {
    console.log('🛑 Shutting down server...');
    this.server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  }

  getApp() {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new MediaDownloaderServer();
  server.start();
}

module.exports = MediaDownloaderServer;