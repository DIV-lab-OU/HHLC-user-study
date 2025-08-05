// Constants
const TOTAL_CHARTS = 8;
const TOTAL_AVAILABLE_CHARTS = 45; // Total charts available in images folder
const TOTAL_STEPS = TOTAL_CHARTS * 3; // 3 questions per chart
const container = document.body;
let currentStep = 0;
const steps = [];

// Chart categories for stratified sampling
const CHART_CATEGORIES = [
  { name: "Single-class Scatterplots", range: [1, 5] },
  { name: "Multi-class Scatterplots", range: [6, 10] },
  { name: "Single-class Line Charts", range: [11, 15] },
  { name: "Multi-class Line Charts", range: [16, 20] },
  { name: "Single-class Bar Graphs", range: [21, 25] },
  { name: "Multi-class Bar Graphs", range: [26, 30] },
  { name: "Single-class Maps", range: [31, 35] },
  { name: "Multi-class Maps", range: [36, 45] }
];

// Load demographic + response structure
const participantData = JSON.parse(localStorage.getItem("participantData")) || {
  demographic: {},
  responses: []
};

// Generate stratified selection: one chart from each category
function getStratifiedCharts() {
  const selected = [];
  
  CHART_CATEGORIES.forEach(category => {
    const [start, end] = category.range;
    const availableInCategory = [];
    
    // Create array of available charts in this category
    for (let i = start; i <= end; i++) {
      availableInCategory.push(i);
    }
    
    // Randomly select one chart from this category
    const randomIndex = Math.floor(Math.random() * availableInCategory.length);
    selected.push(availableInCategory[randomIndex]);
  });
  
  // Shuffle the selected charts to randomize order
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
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

// Progress bar
const progressBarContainer = document.createElement('div');
progressBarContainer.id = "progress-bar-container";

const progressBar = document.createElement('div');
progressBar.id = "progress-bar";
progressBarContainer.appendChild(progressBar);

// Question counter
const questionCounter = document.createElement('div');
questionCounter.id = "question-counter";
questionCounter.textContent = `Question 1 of ${TOTAL_STEPS}`;

container.insertBefore(progressBarContainer, container.firstChild);
container.insertBefore(questionCounter, container.children[1]);

// Generate 3 steps per chart (3 questions each)
for (let i = 0; i < TOTAL_CHARTS; i++) {
  const chartNumber = selectedCharts[i];
  const chartIndex = i + 1; // For display purposes (1-8)

  // --- Question 1: What can you understand from the graph given? ---
  const understandingStep = document.createElement('section');
  understandingStep.classList.add('step');
  if (i === 0) understandingStep.classList.add('active');

  understandingStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-counter-left">Chart ${chartIndex} of ${TOTAL_CHARTS}</div>
      <div class="study-container">
        <div class="chart-container" id="chart-container-${i}">
          <img src="images/${chartNumber}_chart.png" alt="Chart ${chartNumber}" id="chart-img-${i}">
          <button class="reset-btn" onclick="resetZoom(${i})">Reset</button>
          <div class="zoom-instructions">Double-click • Pinch • Scroll to zoom • Drag when zoomed</div>
        </div>
        <div class="study-question">
          <p><strong>What can you understand from the graph given?</strong></p>
          <textarea id="understanding_${i}" placeholder="Please describe what you can understand from this visualization..." required></textarea>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn" onclick="nextStep()">Next</button>
  `;
  container.appendChild(understandingStep);
  steps.push(understandingStep);

  // --- Question 2: What factors/features drive your understanding? ---
  const factorsStep = document.createElement('section');
  factorsStep.classList.add('step');

  factorsStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-counter-left">Chart ${chartIndex} of ${TOTAL_CHARTS}</div>
      <div class="study-container">
        <div class="chart-container" id="chart-container-${i}-2">
          <img src="images/${chartNumber}_chart.png" alt="Chart ${chartNumber}" id="chart-img-${i}-2">
          <button class="reset-btn" onclick="resetZoom('${i}-2')">Reset</button>
          <div class="zoom-instructions">Double-click • Pinch • Scroll to zoom • Drag when zoomed</div>
        </div>
        <div class="study-question">
          <p><strong>What factors/features drive your understanding?</strong></p>
          <textarea id="factors_${i}" placeholder="Please describe what specific elements, patterns, or features in the visualization help you understand the data..." required></textarea>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn" onclick="nextStep()">Next</button>
  `;
  container.appendChild(factorsStep);
  steps.push(factorsStep);

  // --- Question 3: Difficulty level ---
  const difficultyStep = document.createElement('section');
  difficultyStep.classList.add('step');

  difficultyStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-counter-left">Chart ${chartIndex} of ${TOTAL_CHARTS}</div>
      <div class="study-container">
        <div class="chart-container" id="chart-container-${i}-3">
          <img src="images/${chartNumber}_chart.png" alt="Chart ${chartNumber}" id="chart-img-${i}-3">
          <button class="reset-btn" onclick="resetZoom('${i}-3')">Reset</button>
          <div class="zoom-instructions">Double-click • Pinch • Scroll to zoom • Drag when zoomed</div>
        </div>
        <div class="study-question">
          <p><strong>Your difficulty level in interpreting this graph?</strong></p>
          <div class="difficulty-scale">
            <div class="scale-options">
              <label><input type="radio" name="difficulty_${i}" value="1" required> 1</label>
              <label><input type="radio" name="difficulty_${i}" value="2"> 2</label>
              <label><input type="radio" name="difficulty_${i}" value="3"> 3</label>
              <label><input type="radio" name="difficulty_${i}" value="4"> 4</label>
              <label><input type="radio" name="difficulty_${i}" value="5"> 5</label>
            </div>
            <div class="scale-labels">
              <span>Very Easy</span>
              <span>Very Difficult</span>
            </div>
          </div>
          <textarea id="difficulty_text_${i}" placeholder="Optional: Please elaborate on your difficulty level or any specific challenges you faced..." style="margin-top: 15px;"></textarea>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn" onclick="nextStep()">Next</button>
  `;
  container.appendChild(difficultyStep);
  steps.push(difficultyStep);
}

// Navigation functions
function nextStep() {
  // Validate current step
  if (!validateCurrentStep()) {
    return;
  }

  // Save response for current chart if we're at the end of a chart (every 3rd step)
  if ((currentStep + 1) % 3 === 0) {
    saveChartResponse();
  }

  // Move to next step
  steps[currentStep].classList.remove('active');
  currentStep++;

  if (currentStep >= steps.length) {
    // Study complete - submit data
    submitData();
    return;
  }

  steps[currentStep].classList.add('active');
  updateProgress();
  window.scrollTo(0, 0);
}

function validateCurrentStep() {
  const currentStepElement = steps[currentStep];
  const questionType = currentStep % 3; // 0=understanding, 1=factors, 2=difficulty
  
  if (questionType === 0 || questionType === 1) {
    // Text area validation
    const textarea = currentStepElement.querySelector('textarea');
    if (!textarea.value.trim()) {
      alert('Please provide an answer before continuing.');
      textarea.focus();
      return false;
    }
  } else if (questionType === 2) {
    // Difficulty scale validation
    const chartIndex = Math.floor(currentStep / 3);
    const difficultyRadio = document.querySelector(`input[name="difficulty_${chartIndex}"]:checked`);
    if (!difficultyRadio) {
      alert('Please select a difficulty level before continuing.');
      return false;
    }
  }
  
  return true;
}

function saveChartResponse() {
  const chartIndex = Math.floor(currentStep / 3);
  const chartNumber = selectedCharts[chartIndex];
  
  const understanding = document.getElementById(`understanding_${chartIndex}`).value.trim();
  const factors = document.getElementById(`factors_${chartIndex}`).value.trim();
  const difficultyScale = document.querySelector(`input[name="difficulty_${chartIndex}"]:checked`).value;
  const difficultyText = document.getElementById(`difficulty_text_${chartIndex}`).value.trim();
  
  const response = {
    chartId: chartNumber,
    chartIndex: chartIndex + 1,
    chartCategory: getChartCategory(chartNumber),
    understanding: understanding,
    factors: factors,
    difficultyScale: parseInt(difficultyScale),
    difficultyText: difficultyText
  };
  
  participantData.responses.push(response);
  localStorage.setItem("participantData", JSON.stringify(participantData));
}

function updateProgress() {
  const progressPercent = ((currentStep + 1) / steps.length) * 100;
  progressBar.style.width = progressPercent + '%';
  
  // Update question counter
  const questionCounter = document.getElementById('question-counter');
  if (questionCounter) {
    questionCounter.textContent = `Question ${currentStep + 1} of ${TOTAL_STEPS}`;
  }
}

function submitData() {
  // Create chart categories mapping
  const chartCategories = {};
  selectedCharts.forEach(chartId => {
    chartCategories[chartId] = getChartCategory(chartId);
  });

  // Add timestamp and session info
  const finalData = {
    ...participantData,
    sessionId: `session_${Date.now()}`,
    selectedCharts: selectedCharts,
    chartCategories: chartCategories,
    completedAt: new Date().toISOString(),
    totalTimeMinutes: calculateStudyTime()
  };

  // Submit to server
  fetch('/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(finalData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Clear local storage
      localStorage.removeItem("participantData");
      
      // Show completion message
      container.innerHTML = `
        <div class="container">
          <div class="start-container">
            <h1>Thank You!</h1>
            <p>Your responses have been submitted successfully.</p>
            <p>Thank you for participating in the HHLC User Study!</p>
            <p>You may now close this window.</p>
          </div>
        </div>
      `;
    } else {
      alert('Error submitting data. Please try again.');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error submitting data. Please try again.');
  });
}

function calculateStudyTime() {
  // This is a simple implementation - you could enhance it with actual timing
  const startTime = localStorage.getItem("studyStartTime");
  if (startTime) {
    return Math.round((Date.now() - parseInt(startTime)) / 60000); // minutes
  }
  return null;
}

// Initialize
updateProgress();

// Store study start time
if (!localStorage.getItem("studyStartTime")) {
  localStorage.setItem("studyStartTime", Date.now().toString());
}

// Zoom and drag functionality
const zoomState = {};

function initializeZoomDrag(containerId, imgId) {
  if (!zoomState[containerId]) {
    zoomState[containerId] = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      lastTouchDistance: 0
    };
  }

  const container = document.getElementById(containerId);
  const img = document.getElementById(imgId);
  
  if (!container || !img) return;

  // Mouse wheel zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(containerId, imgId, delta, centerX, centerY);
  });

  // Double-click zoom
  container.addEventListener('dblclick', (e) => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    if (zoomState[containerId].scale === 1) {
      // Zoom in to 2x at the clicked point
      zoom(containerId, imgId, 2, centerX, centerY);
    } else {
      // Reset zoom
      zoomState[containerId].scale = 1;
      zoomState[containerId].translateX = 0;
      zoomState[containerId].translateY = 0;
      updateTransform(imgId, containerId);
    }
  });

  // Mouse events for dragging
  container.addEventListener('mousedown', (e) => {
    if (zoomState[containerId].scale > 1) {
      zoomState[containerId].isDragging = true;
      zoomState[containerId].startX = e.clientX - zoomState[containerId].translateX;
      zoomState[containerId].startY = e.clientY - zoomState[containerId].translateY;
      container.classList.add('dragging');
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (zoomState[containerId].isDragging) {
      zoomState[containerId].translateX = e.clientX - zoomState[containerId].startX;
      zoomState[containerId].translateY = e.clientY - zoomState[containerId].startY;
      updateTransform(imgId, containerId);
      e.preventDefault();
    }
  });

  document.addEventListener('mouseup', () => {
    if (zoomState[containerId].isDragging) {
      zoomState[containerId].isDragging = false;
      container.classList.remove('dragging');
    }
  });

  // Touch events for pinch-to-zoom and dragging
  let lastTouchDistance = 0;
  let touchCenter = { x: 0, y: 0 };

  container.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const rect = container.getBoundingClientRect();
      touchCenter.x = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
      touchCenter.y = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
    } else if (e.touches.length === 1 && zoomState[containerId].scale > 1) {
      // Single touch drag
      zoomState[containerId].isDragging = true;
      zoomState[containerId].startX = e.touches[0].clientX - zoomState[containerId].translateX;
      zoomState[containerId].startY = e.touches[0].clientY - zoomState[containerId].translateY;
    }
  });

  container.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastTouchDistance > 0) {
        const delta = distance / lastTouchDistance;
        zoom(containerId, imgId, delta, touchCenter.x, touchCenter.y);
      }
      
      lastTouchDistance = distance;
    } else if (e.touches.length === 1 && zoomState[containerId].isDragging) {
      // Single touch drag
      zoomState[containerId].translateX = e.touches[0].clientX - zoomState[containerId].startX;
      zoomState[containerId].translateY = e.touches[0].clientY - zoomState[containerId].startY;
      updateTransform(imgId, containerId);
    }
  });

  container.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      zoomState[containerId].isDragging = false;
      lastTouchDistance = 0;
    }
  });
}

function zoom(containerId, imgId, delta, centerX, centerY) {
  const state = zoomState[containerId];
  const newScale = Math.min(Math.max(state.scale * delta, 1), 4);
  
  if (newScale !== state.scale) {
    // Adjust translation to zoom into the center point
    const scaleDiff = newScale / state.scale;
    state.translateX = centerX - (centerX - state.translateX) * scaleDiff;
    state.translateY = centerY - (centerY - state.translateY) * scaleDiff;
    
    state.scale = newScale;
    
    if (state.scale === 1) {
      state.translateX = 0;
      state.translateY = 0;
    }
    
    updateTransform(imgId, containerId);
  }
}

function updateTransform(imgId, containerId) {
  const img = document.getElementById(imgId);
  if (img) {
    const state = zoomState[containerId];
    img.style.transform = `scale(${state.scale}) translate(${state.translateX / state.scale}px, ${state.translateY / state.scale}px)`;
  }
}

function resetZoom(chartId) {
  const containerId = `chart-container-${chartId}`;
  const imgId = `chart-img-${chartId}`;
  
  if (!zoomState[containerId]) {
    initializeZoomDrag(containerId, imgId);
  }
  
  zoomState[containerId].scale = 1;
  zoomState[containerId].translateX = 0;
  zoomState[containerId].translateY = 0;
  updateTransform(imgId, containerId);
}

// Initialize zoom/drag for all charts when page loads
document.addEventListener('DOMContentLoaded', function() {
  for (let i = 0; i < TOTAL_CHARTS; i++) {
    initializeZoomDrag(`chart-container-${i}`, `chart-img-${i}`);
    initializeZoomDrag(`chart-container-${i}-2`, `chart-img-${i}-2`);
    initializeZoomDrag(`chart-container-${i}-3`, `chart-img-${i}-3`);
  }
});

// Also initialize when switching steps
const originalNextStep = nextStep;
nextStep = function() {
  originalNextStep();
  
  // Initialize zoom/drag for newly visible chart
  setTimeout(() => {
    const stepIndex = Math.floor(currentStep / 3);
    const questionIndex = currentStep % 3;
    
    if (stepIndex < TOTAL_CHARTS) {
      let suffix = '';
      if (questionIndex === 1) suffix = '-2';
      if (questionIndex === 2) suffix = '-3';
      
      const containerId = `chart-container-${stepIndex}${suffix}`;
      const imgId = `chart-img-${stepIndex}${suffix}`;
      initializeZoomDrag(containerId, imgId);
    }
  }, 100);
};
