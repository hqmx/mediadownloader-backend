const express = require('express');
const downloadController = require('../controllers/downloadController');

const router = express.Router();

// Health check
router.get('/health', downloadController.healthCheck.bind(downloadController));

// Video info routes
router.post('/api/video-info', downloadController.getVideoInfo.bind(downloadController));

// Format routes
router.get('/api/formats', downloadController.getSupportedFormats.bind(downloadController));

// Download routes
router.post('/api/download', downloadController.startDownload.bind(downloadController));
router.get('/api/download/stream/:downloadId', downloadController.streamDownload.bind(downloadController));
router.get('/api/download/progress/:downloadId', downloadController.getDownloadProgress.bind(downloadController));

// Admin routes
router.delete('/api/cleanup', downloadController.cleanupTempFiles.bind(downloadController));

module.exports = router;