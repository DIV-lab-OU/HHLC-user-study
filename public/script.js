// Constants
const TOTAL_CHARTS = 16; // 2 charts per category (8 categories -> 16 charts total)
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
// Enhanced study script with session management
const participantData = JSON.parse(localStorage.getItem("participantData")) || {
  participantId: 'unknown',
  demographic: {},
  responses: []
};

let sessionManager;

// Generate stratified selection: one chart from each category
function getStratifiedCharts() {
  const selected = [];

  // For each category, pick 2 unique random charts from the category range
  CHART_CATEGORIES.forEach(category => {
    const [start, end] = category.range;
    const availableInCategory = [];

    for (let i = start; i <= end; i++) {
      availableInCategory.push(i);
    }

    // Shuffle availableInCategory and take first 2 to ensure equal chance for each
    for (let k = availableInCategory.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [availableInCategory[k], availableInCategory[r]] = [availableInCategory[r], availableInCategory[k]];
    }

    // Take up to two items (handles categories with only 1 or 2 items gracefully)
    selected.push(...availableInCategory.slice(0, 2));
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
  if (i === 0) {
    understandingStep.classList.add('active');
    // Start the study timer when the first chart is displayed
    startStudyTimer();
  }

  understandingStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-counter-left">Chart ${chartIndex} of ${TOTAL_CHARTS}</div>
      <div class="study-container">
        <div class="chart-container" id="chart-container-${i}">
          <img src="images/${chartNumber}_chart.png" alt="Chart ${chartNumber}" id="chart-img-${i}">
        </div>
        <div class="study-question">
          <p>Describe what you can understand from this graph.</p>
          <textarea id="understanding_${i}" placeholder="Please describe what you see in the visualization..." required></textarea>
          <div class="chart-controls">
            <div class="zoom-instructions">Double-click • Pinch • Scroll to zoom • Drag when zoomed</div>
          </div>
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
          <canvas id="chart-canvas-${i}-2" class="chart-lasso-canvas"></canvas>
        </div>
        <div class="study-question">
          <p>What features or patterns stand out to you in this graph?</p>
          <p>Lasso the salient region in the graph using your mouse or touch. Press <em>Clear Lasso</em> to redraw.</p>
          <div style="display:flex; gap:10px; align-items:center; margin-top:8px;">
            <button type="button" id="save-lasso-btn-${i}" class="start-btn" style="width:140px; background:#28a745;" onclick="saveLasso(${i})">Save Lasso</button>
            <button type="button" class="start-btn" style="width:140px; background:#ccc; color:#000;" onclick="clearLasso(${i})">Clear Lasso</button>
            <span id="lasso-status-${i}" style="margin-left:8px; color:#666; font-size:14px;">No lasso saved</span>
          </div>
          <div class="chart-controls">
            <div class="zoom-instructions">Double-click • Pinch • Scroll to zoom • Drag when zoomed</div>
          </div>
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
          <canvas id="chart-canvas-${i}-3" class="chart-lasso-canvas"></canvas>
        </div>
        <div class="study-question">
          <p>How difficult was it for you to understand this graph?</p>
          <p style="font-size: 14px; color: #666; margin-top: 5px;">(1 = Very Easy, 5 = Very Difficult)</p>
          <div class="familiarity-slider-container" style="max-width:360px; margin-bottom:16px;">
            <div class="slider-group">
              <input type="range" id="difficulty_slider_${i}" name="difficulty_slider_${i}" min="1" max="5" value="3" class="familiarity-slider" required oninput="updateSliderValue('difficulty_slider_${i}', this.value)">
              <span class="slider-value" id="difficulty_slider_${i}-value">3</span>
            </div>
            <div class="slider-labels">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
          <div class="chart-controls">
            <div class="zoom-instructions">Double-click • Pinch • Scroll to zoom • Drag when zoomed</div>
          </div>
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

// Global helper for updating shown slider values
function updateSliderValue(sliderId, value) {
  const valueEl = document.getElementById(`${sliderId}-value`);
  if (valueEl) valueEl.textContent = value;
}

function validateCurrentStep() {
  const currentStepElement = steps[currentStep];
  const questionType = currentStep % 3; // 0=understanding, 1=factors, 2=difficulty
  
  if (questionType === 0) {
    // Question 1: text area validation (understanding)
    const textarea = currentStepElement.querySelector('textarea');
    if (!textarea || !textarea.value.trim()) {
      alert('Please provide an answer before continuing.');
      if (textarea) textarea.focus();
      return false;
    }
  } else if (questionType === 1) {
    // Question 2: require a saved lasso
    const chartIndex = Math.floor(currentStep / 3);
    const canvas = document.getElementById(`chart-canvas-${chartIndex}-2`);
    if (canvas) {
      if (!canvas._savedLasso || canvas._savedLasso.length === 0) {
        alert('Please draw and save a lasso region in the graph before continuing. Use Save Lasso.');
        return false;
      }
    } else {
      alert('Lasso canvas not available.');
      return false;
    }
  } else if (questionType === 2) {
    // Difficulty scale validation
    const chartIndex = Math.floor(currentStep / 3);
    const slider = document.getElementById(`difficulty_slider_${chartIndex}`);
    if (!slider || !slider.value) {
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
  // For lasso step, capture freeform text if present (we repurposed factors step to lasso)
  const factorsTextArea = document.getElementById(`factors_${chartIndex}`);
  const factors = factorsTextArea ? factorsTextArea.value.trim() : '';
  // Difficulty now comes from slider
  const difficultySlider = document.getElementById(`difficulty_slider_${chartIndex}`);
  const difficultyScale = difficultySlider ? difficultySlider.value : '3';

  // Capture lasso coordinates (normalized to image width/height)
  const lassoCanvas = document.getElementById(`chart-canvas-${chartIndex}-2`);
  let lassoCoords = [];
  let lassoSummary = null;
  if (lassoCanvas) {
    if (lassoCanvas._savedLassoSummary && lassoCanvas._savedLassoSummary.vertices) {
      lassoCoords = lassoCanvas._savedLassoSummary.vertices;
      lassoSummary = {
        bbox: lassoCanvas._savedLassoSummary.bbox,
        centroid: lassoCanvas._savedLassoSummary.centroid,
        area: lassoCanvas._savedLassoSummary.area
      };
    } else {
      const stored = lassoCanvas._savedLasso && lassoCanvas._savedLasso.length ? lassoCanvas._savedLasso : (lassoCanvas._lassoCoords || []);
      if (stored && stored.length) {
        const w = lassoCanvas.width;
        const h = lassoCanvas.height;
        lassoCoords = stored.map(pt => ({ x: pt.x / w, y: pt.y / h }));
        // compute a quick summary
        lassoSummary = {
          bbox: bboxFromPoints(lassoCoords),
          centroid: polygonCentroid(lassoCoords),
          area: polygonArea(lassoCoords)
        };
      }
    }
  }
  
  const response = {
    chartId: chartNumber,
    chartIndex: chartIndex + 1,
    chartCategory: getChartCategory(chartNumber),
    understanding: understanding,
  factors: factors,
  lasso: lassoCoords,
  lassoSummary: lassoSummary,
  difficultyScale: parseInt(difficultyScale)
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

  // Stop the timer and get detailed timing information
  const timingData = stopStudyTimer();

  // Prepare data for intermediate save (before post-study questions)
  const intermediateData = {
    ...participantData,
    sessionId: sessionManager ? sessionManager.sessionId : `session_${Date.now()}`,
    selectedCharts: selectedCharts,
    chartCategories: chartCategories,
    mainStudyCompletedAt: new Date().toISOString(),
    totalTimeMinutes: calculateStudyTime(),
    mainStudyCompletionTime: Date.now(),
    // Enhanced timing information
    studyTiming: {
      startTime: timingData.startTime,
      endTime: timingData.endTime,
      totalDurationMs: timingData.durationMs,
      totalDurationSeconds: timingData.durationSeconds,
      totalDurationMinutes: timingData.durationMinutes,
      formattedDuration: formatDuration(timingData.durationMs)
    }
  };
  
  // Save intermediate data to localStorage for post-study page
  localStorage.setItem("participantData", JSON.stringify(intermediateData));
  
  // Mark main study as complete in session
  if (sessionManager) {
    sessionManager.markStudyComplete();
  }

  // Redirect to post-study page instead of completing
  window.location.href = 'postStudy.html';
}

function calculateStudyTime() {
  // Use the precise timer if available
  if (totalStudyDurationMs > 0) {
    return Math.round(totalStudyDurationMs / 60000); // minutes
  }
  
  // Fallback to localStorage method
  const startTime = localStorage.getItem("studyStartTime");
  if (startTime) {
    return Math.round((Date.now() - parseInt(startTime)) / 60000); // minutes
  }
  return null;
}

// Initialize
updateProgress();

// Create participant ID display for video recording
function createParticipantIdDisplay() {
  const participantIdDisplay = document.createElement('div');
  participantIdDisplay.id = 'participant-id-display';
  participantIdDisplay.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 3px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 10px;
    font-weight: normal;
    z-index: 1000;
    opacity: 0.8;
  `;
  
  participantIdDisplay.textContent = 'Loading...';
  document.body.appendChild(participantIdDisplay);
  
  // Function to update participant ID
  function updateParticipantId() {
    let participantId = null;
    
    // Try multiple ways to get participant ID
    if (window.currentSession && typeof window.currentSession.getParticipantId === 'function') {
      participantId = window.currentSession.getParticipantId();
    } else if (sessionManager && typeof sessionManager.getParticipantId === 'function') {
      participantId = sessionManager.getParticipantId();
    } else {
      // Try to get from sessionStorage directly
      try {
        const sessionData = JSON.parse(sessionStorage.getItem('sessionManager') || '{}');
        participantId = sessionData.participantId;
      } catch (e) {
        console.log('Could not parse session data');
      }
    }
    
    if (participantId && participantId !== 'Loading...') {
      participantIdDisplay.textContent = participantId;
      return true; // Found ID, stop trying
    }
    return false; // Keep trying
  }
  
  // Try to update immediately
  if (!updateParticipantId()) {
    // If not available, keep trying every second for up to 10 seconds
    let attempts = 0;
    const maxAttempts = 10;
    const updateInterval = setInterval(() => {
      attempts++;
      if (updateParticipantId() || attempts >= maxAttempts) {
        clearInterval(updateInterval);
        if (attempts >= maxAttempts) {
          participantIdDisplay.textContent = 'ID Not Found';
        }
      }
    }, 1000);
  }
}

// Create participant ID display
createParticipantIdDisplay();

// Create and display timer
function createTimerDisplay() {
  const timerDisplay = document.createElement('div');
  timerDisplay.id = 'study-timer';
  timerDisplay.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(255, 255, 255, 0.95);
    padding: 8px 16px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 16px;
    font-weight: normal;
    color: #333;
    z-index: 1000;
    border: 2px solid #007cba;
  `;
  timerDisplay.textContent = 'Study Time: 00:00';
  document.body.appendChild(timerDisplay);
}

// Start the study timer
function startStudyTimer() {
  if (!studyStartTime) {
    studyStartTime = Date.now();
    localStorage.setItem("studyStartTime", studyStartTime.toString());
    
    // Update timer display every second
    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay(); // Initial update
  }
}

// Update timer display
function updateTimerDisplay() {
  if (!studyStartTime) return;
  
  const elapsed = Date.now() - studyStartTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  
  const timerDisplay = document.getElementById('study-timer');
  if (timerDisplay) {
    timerDisplay.textContent = `Study Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Stop the study timer and calculate final duration
function stopStudyTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  if (studyStartTime) {
    totalStudyDurationMs = Date.now() - studyStartTime;
  }
  
  return {
    durationMs: totalStudyDurationMs,
    durationMinutes: Math.round(totalStudyDurationMs / 60000),
    durationSeconds: Math.round(totalStudyDurationMs / 1000),
    startTime: studyStartTime,
    endTime: Date.now()
  };
}

// Format duration for display
function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize timer display
createTimerDisplay();

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
      lastTouchDistance: 0,
      initialized: false
    };
  }

  const container = document.getElementById(containerId);
  const img = document.getElementById(imgId);
  
  if (!container || !img || zoomState[containerId].initialized) return;
  
  // Mark as initialized to prevent duplicate event listeners
  zoomState[containerId].initialized = true;

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
    e.stopPropagation();
    const rect = container.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    console.log('Double-click detected on container:', containerId); // Debug log
    
    if (zoomState[containerId].scale === 1) {
      // Zoom in to 2x at the clicked point
      console.log('Zooming in to 2x'); // Debug log
      zoom(containerId, imgId, 2, centerX, centerY);
    } else {
      // Reset zoom
      console.log('Resetting zoom'); // Debug log
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
  
  console.log(`Zoom called: containerId=${containerId}, currentScale=${state.scale}, newScale=${newScale}, delta=${delta}`); // Debug log
  
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
    
    console.log(`Zoom applied: scale=${state.scale}, translateX=${state.translateX}, translateY=${state.translateY}`); // Debug log
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

// -------------------- Lasso / Canvas utilities --------------------
function initializeCanvasForLasso(canvasId, imgId) {
  const canvas = document.getElementById(canvasId);
  const img = document.getElementById(imgId);
  if (!canvas || !img) return;

  // size canvas to image displayed size
  const rect = img.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.style.position = 'absolute';
  canvas.style.left = img.offsetLeft + 'px';
  canvas.style.top = img.offsetTop + 'px';
  canvas.style.pointerEvents = 'auto';
  canvas.style.background = 'transparent';
  canvas._lassoCoords = canvas._lassoCoords || [];

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width, canvas.height);

  let drawing = false;
  // create tooltip (cache on canvas to avoid duplicates)
  let tooltip = canvas._lassoTooltip;
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'lasso-tooltip';
    tooltip.style.display = 'none';
    tooltip.textContent = '✎ Lasso';
    document.body.appendChild(tooltip);
    canvas._lassoTooltip = tooltip;
  }

  function startDraw(x,y) {
    drawing = true;
    canvas._lassoCoords = [{x,y}];
    redrawCanvas();
  canvas.classList.add('lasso-drawing');
  tooltip.style.display = 'block';
  tooltip.style.left = (x + canvas.getBoundingClientRect().left) + 'px';
  tooltip.style.top = (canvas.getBoundingClientRect().top + y) + 'px';
  }

  function moveDraw(x,y) {
    if (!drawing) return;
    canvas._lassoCoords.push({x,y});
    redrawCanvas();
  // update tooltip position
  tooltip.style.left = (x + canvas.getBoundingClientRect().left) + 'px';
  tooltip.style.top = (canvas.getBoundingClientRect().top + y) + 'px';
  }

  function endDraw() {
    drawing = false;
    // close polygon by repeating first point if more than 2 points
    if (canvas._lassoCoords.length > 2) {
      canvas._lassoCoords.push({...canvas._lassoCoords[0]});
    }
    redrawCanvas(true);
  canvas.classList.remove('lasso-drawing');
  tooltip.style.display = 'none';
  }

  function getXYFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function redrawCanvas(finalize = false) {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    if (!canvas._lassoCoords || canvas._lassoCoords.length === 0) return;
  // red lasso style
  ctx.fillStyle = 'rgba(220,20,60,0.12)';
  ctx.strokeStyle = '#dc143c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas._lassoCoords[0].x, canvas._lassoCoords[0].y);
    for (let i = 1; i < canvas._lassoCoords.length; i++) {
      ctx.lineTo(canvas._lassoCoords[i].x, canvas._lassoCoords[i].y);
    }
    if (finalize) ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }


  // Avoid attaching duplicate listeners when re-initializing on resize/step-change
  if (!canvas._listenersInitialized) {
    // Mouse events
    canvas.addEventListener('mousedown', (e) => { e.preventDefault(); const p = getXYFromEvent(e); startDraw(p.x,p.y); });
    canvas.addEventListener('mousemove', (e) => { e.preventDefault(); const p = getXYFromEvent(e); moveDraw(p.x,p.y); });
    document.addEventListener('mouseup', (e) => { if (drawing) endDraw(); });

    // Touch events
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const p = getXYFromEvent(e); startDraw(p.x,p.y); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); const p = getXYFromEvent(e); moveDraw(p.x,p.y); });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); endDraw(); });

    canvas._listenersInitialized = true;
  }

  // Ensure pointer events enabled for active canvases
  canvas.style.pointerEvents = 'auto';

  // expose clear function
  canvas.clearLasso = function() {
    canvas._lassoCoords = [];
    ctx.clearRect(0,0,canvas.width, canvas.height);
  };
}

// --- Geometry helpers ---
function pointDist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}

// perpendicular distance from p to line (a-b)
function perpDistance(p, a, b) {
  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;
  const dot = A * C + B * D;
  const len2 = C*C + D*D;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, dot / len2));
  const projX = a.x + t * C;
  const projY = a.y + t * D;
  return Math.sqrt((p.x - projX)*(p.x - projX) + (p.y - projY)*(p.y - projY));
}

// Ramer-Douglas-Peucker simplification (recursive)
function rdpSimplify(points, epsilon) {
  if (!points || points.length < 3) return points ? points.slice() : [];
  let maxDist = 0;
  let index = -1;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }
  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, index + 1), epsilon);
    const right = rdpSimplify(points.slice(index, points.length), epsilon);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [points[0], points[end]];
  }
}

function polygonArea(points) {
  if (!points || points.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < points.length - 1; i++) {
    a += points[i].x * points[i+1].y - points[i+1].x * points[i].y;
  }
  return Math.abs(a) / 2;
}

function polygonCentroid(points) {
  if (!points || points.length === 0) return {x:0,y:0};
  // simple average of vertices (fast, robust)
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  return { x: sx / points.length, y: sy / points.length };
}

function bboxFromPoints(points) {
  if (!points || points.length === 0) return {minX:0,minY:0,maxX:0,maxY:0};
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {minX, minY, maxX, maxY};
}

// Deactivate a canvas so it stops accepting pointer events and hides tooltip
function deactivateCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  // disable pointer interaction
  canvas.style.pointerEvents = 'none';
  // hide any drawing tooltip
  if (canvas._lassoTooltip) {
    canvas._lassoTooltip.style.display = 'none';
  }
  // clear drawing cursor state
  canvas.classList.remove('lasso-drawing');
}

function clearLasso(index) {
  const canvas = document.getElementById(`chart-canvas-${index}-2`);
  if (canvas && canvas.clearLasso) canvas.clearLasso();
  if (canvas) {
    canvas._savedLasso = [];
    canvas._lassoSaved = false;
  }
  const statusEl = document.getElementById(`lasso-status-${index}`);
  if (statusEl) statusEl.textContent = 'No lasso saved';
}

function saveLasso(index) {
  const canvas = document.getElementById(`chart-canvas-${index}-2`);
  const statusEl = document.getElementById(`lasso-status-${index}`);
  if (!canvas) {
    if (statusEl) statusEl.textContent = 'Lasso unavailable';
    return;
  }
  if (!canvas._lassoCoords || canvas._lassoCoords.length < 3) {
    if (statusEl) statusEl.textContent = 'Draw a region first';
    alert('Please draw a lasso region before saving.');
    return;
  }
  // snapshot current lasso coords
  // Simplify and store a compact representation
  const raw = canvas._lassoCoords.slice();
  // remove consecutive duplicates
  const filtered = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const p = raw[i];
    const last = filtered[filtered.length - 1];
    if (Math.abs(p.x - last.x) > 0.5 || Math.abs(p.y - last.y) > 0.5) { // pixel threshold
      filtered.push(p);
    }
  }
  // Ensure polygon closed
  if (filtered.length > 2 && (filtered[0].x !== filtered[filtered.length-1].x || filtered[0].y !== filtered[filtered.length-1].y)) {
    filtered.push({...filtered[0]});
  }

  // Simplify using RDP (epsilon in pixels)
  const simplified = rdpSimplify(filtered, 2.5);
  // Limit vertices to a reasonable max (e.g., 40)
  const MAX_VERTS = 40;
  let finalVerts = simplified;
  if (finalVerts.length > MAX_VERTS) {
    // uniform downsample (keep first and last)
    const keep = [finalVerts[0]];
    for (let i = 1; i < finalVerts.length - 1; i++) {
      if (i % Math.ceil((finalVerts.length - 2) / (MAX_VERTS - 2)) === 0) keep.push(finalVerts[i]);
    }
    keep.push(finalVerts[finalVerts.length-1]);
    finalVerts = keep;
  }

  canvas._savedLasso = finalVerts;
  canvas._lassoSaved = true;
  if (statusEl) statusEl.textContent = 'Lasso saved';
  // visually indicate saved (slightly darker fill)
  const ctx = canvas.getContext('2d');
  // saved lasso: slightly stronger red
  ctx.fillStyle = 'rgba(220,20,60,0.22)';
  ctx.strokeStyle = '#a10b23';
  ctx.lineWidth = 2;
  // redraw saved polygon
  if (canvas._savedLasso && canvas._savedLasso.length) {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(canvas._savedLasso[0].x, canvas._savedLasso[0].y);
    for (let k = 1; k < canvas._savedLasso.length; k++) ctx.lineTo(canvas._savedLasso[k].x, canvas._savedLasso[k].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // compute and cache a summary on the canvas for later retrieval
    try {
      const w = canvas.width;
      const h = canvas.height;
      const normalized = canvas._savedLasso.map(p => ({ x: p.x / w, y: p.y / h }));
      const bbox = bboxFromPoints(normalized);
      const centroid = polygonCentroid(normalized);
      const area = polygonArea(normalized);
      canvas._savedLassoSummary = {
        vertices: normalized,
        bbox,
        centroid,
        area
      };
    } catch (err) {
      console.warn('Error computing lasso summary', err);
    }
  }
}

// Resize canvas when image or window changes
window.addEventListener('resize', () => {
  // Reinit canvases for visible charts
  for (let i = 0; i < TOTAL_CHARTS; i++) {
    initializeCanvasForLasso(`chart-canvas-${i}-2`, `chart-img-${i}-2`);
  // make sure difficulty-step canvases don't accept pointer events
  deactivateCanvas(`chart-canvas-${i}-3`);
  }
});


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
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize session management
  sessionManager = window.currentSession || new SessionManager();
  const sessionValid = await sessionManager.ensureSession();
  if (!sessionValid) return;
  
  console.log(`Study loaded for participant: ${sessionManager.getParticipantId()}`);
  
  // Initialize chart zoom/drag
  for (let i = 0; i < TOTAL_CHARTS; i++) {
    initializeZoomDrag(`chart-container-${i}`, `chart-img-${i}`);
  // Initialize zoom/drag for the auxiliary step images as well; canvases are only needed for the lasso step (-2)
  initializeZoomDrag(`chart-container-${i}-2`, `chart-img-${i}-2`);
  initializeZoomDrag(`chart-container-${i}-3`, `chart-img-${i}-3`);
  // Initialize lasso canvas only for the lasso/factors step (-2)
  initializeCanvasForLasso(`chart-canvas-${i}-2`, `chart-img-${i}-2`);
  // ensure difficulty-step canvases are deactivated
  deactivateCanvas(`chart-canvas-${i}-3`);
  }
});

// Also initialize when switching steps
const originalNextStep = nextStep;
nextStep = function() {
  // Keep a reference to the previous step so we can deactivate any lasso canvas on it
  const prevStep = currentStep;

  originalNextStep();

  // Deactivate lasso canvas from previous question if it exists (so it doesn't remain active on next step)
  try {
    const prevQuestionIndex = prevStep % 3;
    const prevChartIndex = Math.floor(prevStep / 3);
    if (prevQuestionIndex === 1) {
      deactivateCanvas(`chart-canvas-${prevChartIndex}-2`);
    }
  } catch (err) {
    console.warn('Error while deactivating previous canvas', err);
  }

  // Initialize zoom/drag and canvases for newly visible chart/step
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
      // init canvas overlays only for the lasso/factors step
      if (questionIndex === 1) {
        initializeCanvasForLasso(`chart-canvas-${stepIndex}-2`, `chart-img-${stepIndex}-2`);
      }
    }
  }, 100);
};
