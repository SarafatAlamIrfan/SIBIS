const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Mount protected routes
router.get('/recommendations', protect, aiController.getRecommendations);
router.get('/insights', protect, aiController.getInsights);

module.exports = router;
