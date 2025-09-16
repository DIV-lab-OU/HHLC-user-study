// Integration script to connect existing study pages with new data collection
// This file should be included in your study.html and other pages

import { dataCollector } from './dataCollector.js';

// Enhanced submission function that replaces the original server submission
async function submitToHybridSystem() {
  console.log('Submitting data via hybrid system...');
  
  // Get all the data that was collected during the study
  const participantData = JSON.parse(localStorage.getItem("participantData")) || {};
  
  // Ensure we have all required fields
  if (!participantData.sessionId) {
    participantData.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  if (!participantData.selectedCharts) {
    // Use the selectedCharts from main.js if available
    participantData.selectedCharts = window.selectedCharts || [];
  }
  
  if (!participantData.chartCategories) {
    participantData.chartCategories = {};
    // Build chart categories if we have selectedCharts
    if (participantData.selectedCharts && window.getChartCategory) {
      participantData.selectedCharts.forEach(chartId => {
        participantData.chartCategories[chartId.toString()] = window.getChartCategory(chartId);
      });
    }
  }
  
  // Add completion timestamp
  participantData.completedAt = new Date().toISOString();
  
  // Calculate total time if we have timer data
  if (window.totalStudyDurationMs) {
    participantData.totalTimeMinutes = Math.round(window.totalStudyDurationMs / 60000);
  }
  
  try {
    // Use the hybrid data collection system
    const results = await dataCollector.submitParticipantData(participantData);
    
    // Show completion message
    dataCollector.showCompletionMessage(results, participantData.sessionId);
    
    // Clear localStorage after successful submission
    localStorage.removeItem("participantData");
    
    return { success: true, results };
  } catch (error) {
    console.error('Hybrid submission failed:', error);
    
    // Emergency fallback: just download
    dataCollector.downloadAsJSON(participantData);
    dataCollector.showCompletionMessage(['✅ Emergency download completed'], participantData.sessionId);
    
    return { success: false, error };
  }
}

// Replace the original submitData function
window.submitData = submitToHybridSystem;
window.submitToHybridSystem = submitToHybridSystem;

// Enhanced function to handle study completion
window.completeStudy = async function() {
  // Stop any running timers
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }
  
  // Submit the data
  const result = await submitToHybridSystem();
  
  console.log('Study completion result:', result);
};

// Function to set Formspree endpoint (call this to configure your endpoint)
window.setFormspreeEndpoint = function(endpoint) {
  dataCollector.setFormspreeEndpoint(endpoint);
  console.log('Formspree endpoint configured:', endpoint);
};

// Debug functions for development
window.downloadCurrentData = function() {
  const data = JSON.parse(localStorage.getItem("participantData")) || {};
  dataCollector.downloadAsJSON(data);
};

window.viewCurrentData = function() {
  const data = JSON.parse(localStorage.getItem("participantData")) || {};
  console.log('Current participant data:', data);
  return data;
};

// Expose dataCollector for debugging
window.dataCollector = dataCollector;

console.log('Hybrid data collection system loaded and ready!');