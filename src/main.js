// Main entry point for HHLC Experiment with Vite
import { dataCollector } from './dataCollector.js';
import './styles.css';

// Constants
const TOTAL_CHARTS = 8; // 1 chart per category (8 categories -> 8 charts total)
const TOTAL_AVAILABLE_CHARTS = 40; // Total charts available in images folder (1..40)
const TOTAL_STEPS = TOTAL_CHARTS * 3; // 3 questions per chart
const container = document.body;
let currentStep = 0;
const steps = [];

// Timer variables
let studyStartTime = null;
let timerInterval = null;
let totalStudyDurationMs = 0;

// Chart categories for stratified sampling
const CHART_CATEGORIES = [
  { name: "Single-class Scatterplots", range: [1, 5] },
  { name: "Multi-class Scatterplots", range: [6, 10] },
  { name: "Single-class Line Charts", range: [11, 15] },
  { name: "Multi-class Line Charts", range: [16, 20] },
  { name: "Single-class Bar Graphs", range: [21, 25] },
  { name: "Multi-class Bar Graphs", range: [26, 30] },
  { name: "Single-class Maps", range: [31, 35] },
  { name: "Multi-class Maps", range: [36, 40] }
];

// Load demographic + response structure
const participantData = JSON.parse(localStorage.getItem("participantData")) || {
  participantId: 'unknown',
  demographic: {},
  responses: []
};

let sessionManager;

// Generate stratified selection: one chart from each category
function getStratifiedCharts() {
  const selected = [];

  // For each category, pick 1 unique random chart from the category range
  CHART_CATEGORIES.forEach(category => {
    const [start, end] = category.range;
    const availableInCategory = [];

    for (let i = start; i <= end; i++) {
      availableInCategory.push(i);
    }

    // Shuffle availableInCategory and take first 1 to ensure equal chance for each
    for (let k = availableInCategory.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [availableInCategory[k], availableInCategory[r]] = [availableInCategory[r], availableInCategory[k]];
    }

    // Take up to one item (handles categories with only 1 item gracefully)
    selected.push(...availableInCategory.slice(0, 1));
  });

  // Shuffle the final selection to randomize order across categories
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  // If for any reason we don't have exactly TOTAL_CHARTS, trim or pad (pad by random picks)
  if (selected.length > TOTAL_CHARTS) {
    return selected.slice(0, TOTAL_CHARTS);
  } else if (selected.length < TOTAL_CHARTS) {
    const allAvailable = [];
    for (let i = 1; i <= TOTAL_AVAILABLE_CHARTS; i++) allAvailable.push(i);
    // remove already selected
    const remaining = allAvailable.filter(x => !selected.includes(x));
    while (selected.length < TOTAL_CHARTS && remaining.length) {
      const idx = Math.floor(Math.random() * remaining.length);
      selected.push(remaining.splice(idx, 1)[0]);
    }
  }

  return selected;
}

const selectedCharts = getStratifiedCharts();

// Function to get chart category
function getChartCategory(chartId) {
  for (const category of CHART_CATEGORIES) {
    const [start, end] = category.range;
    if (chartId >= start && chartId <= end) {
      return category.name;
    }
  }
  return "Unknown";
}

// Enhanced data submission function using hybrid approach
async function submitDataHybrid() {
  console.log('Submitting data using hybrid approach...');
  
  // Get all collected data
  const allData = JSON.parse(localStorage.getItem("participantData")) || {};
  
  // Prepare the complete dataset in the same format as your current data structure
  const completeData = {
    demographic: allData.demographic || {},
    responses: allData.responses || [],
    sessionId: allData.sessionId || `session_${Date.now()}`,
    selectedCharts: selectedCharts,
    chartCategories: {},
    completedAt: new Date().toISOString(),
    totalTimeMinutes: Math.round(totalStudyDurationMs / 60000) || 0
  };

  // Build chart categories mapping
  selectedCharts.forEach((chartId, index) => {
    completeData.chartCategories[chartId.toString()] = getChartCategory(chartId);
  });

  try {
    // Use the hybrid data collection system
    const results = await dataCollector.submitParticipantData(completeData);
    
    // Show completion message with results
    dataCollector.showCompletionMessage(results, completeData.sessionId);
    
    console.log('Data submission completed:', results);
  } catch (error) {
    console.error('Data submission failed:', error);
    
    // Fallback: just download the data
    dataCollector.downloadAsJSON(completeData);
    dataCollector.showCompletionMessage(['✅ Downloaded backup file'], completeData.sessionId);
  }
}

// Make functions available globally for HTML onclick handlers
window.submitDataHybrid = submitDataHybrid;
window.getStratifiedCharts = getStratifiedCharts;
window.getChartCategory = getChartCategory;
window.TOTAL_CHARTS = TOTAL_CHARTS;
window.TOTAL_STEPS = TOTAL_STEPS;
window.selectedCharts = selectedCharts;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('HHLC Experiment initialized with Vite');
  console.log('Selected charts for this session:', selectedCharts);
  console.log('Chart categories:', selectedCharts.map(id => ({ id, category: getChartCategory(id) })));
  
  // Initialize session if needed
  if (!localStorage.getItem("participantData")) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("participantData", JSON.stringify({
      sessionId: sessionId,
      demographic: {},
      responses: []
    }));
  }
});

// Export for potential future use
export {
  TOTAL_CHARTS,
  TOTAL_STEPS,
  getStratifiedCharts,
  getChartCategory,
  submitDataHybrid,
  selectedCharts,
  dataCollector
};