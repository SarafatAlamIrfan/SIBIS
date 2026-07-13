const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Proxy request to Python FastAPI forecasting service
exports.getRecommendations = async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/ai/forecast`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('AI Service Error (getRecommendations):', error.message);
    // Graceful fallback description for client resiliency
    return res.status(500).json({ 
      error: 'AI Decision Service is currently offline or unreachable.', 
      details: error.message 
    });
  }
};

// Proxy request to Python FastAPI daily insights service
exports.getInsights = async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/ai/insights`);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('AI Service Error (getInsights):', error.message);
    // Graceful fallback description for client resiliency
    return res.status(500).json({ 
      error: 'AI Business Insights Service is currently offline or unreachable.', 
      details: error.message 
    });
  }
};
