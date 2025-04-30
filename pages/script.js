// Constants
const totalCharts = 54;
const totalSteps = totalCharts * 3;
const container = document.body;
let timer;
let timeLeft;
const steps = [];

// Progress bar
const progressBarContainer = document.createElement('div');
progressBarContainer.id = "progress-bar-container";

const progressBar = document.createElement('div');
progressBar.id = "progress-bar";
progressBarContainer.appendChild(progressBar);
container.insertBefore(progressBarContainer, container.firstChild);

// Timer display
const timerDisplay = document.createElement('p');
timerDisplay.id = "timer";
container.insertBefore(timerDisplay, progressBarContainer.nextSibling);

// Generate 3 steps per chart
for (let i = 0; i < totalCharts; i++) {
  const chartNumber = i + 1;

  // --- Step 1: Trend ---
  const trendStep = document.createElement('section');
  trendStep.classList.add('step');
  if (i === 0) trendStep.classList.add('active');

  trendStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-heading">
        <div>Line Chart <span class="highlight">${chartNumber}</span> of ${totalCharts}</div>
        <div>Task <span class="highlight">1</span> of 3</div>
      </div>
      <div class="study-container">
        <div class="chart-container">
          <img src="../images/${chartNumber}_chart.png" alt="Chart ${chartNumber}">
        </div>
        <div class="study-radio">
          <p>What trend do you see in the line chart?</p>
          <label><input type="radio" name="trend${i}" value="Upward"> Upward</label>
          <label><input type="radio" name="trend${i}" value="Downward"> Downward</label>
          <label><input type="radio" name="trend${i}" value="Irregular"> Irregular</label>
          <label><input type="radio" name="trend${i}" value="Uniform"> Uniform</label>
          <label><input type="radio" name="trend${i}" value="Peak"> Peak</label>
          <label><input type="radio" name="trend${i}" value="Valley"> Valley</label>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn">Next</button>
  `;
  container.appendChild(trendStep);
  steps.push(trendStep);

  // --- Step 2: Confidence (1–5) ---
  const confidenceStep = document.createElement('section');
  confidenceStep.classList.add('step');

  const confidenceOptions = [1, 2, 3, 4, 5].map(n =>
    `<label><input type="radio" name="confidence${i}" value="${n}"> ${n}</label>`
  ).join('');

  confidenceStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-heading">
        <div>Line Chart <span class="highlight">${chartNumber}</span> of ${totalCharts}</div>
        <div>Task <span class="highlight">2</span> of 3</div>
      </div>
      <div class="study-container">
        <div class="chart-container">
          <img src="../images/${chartNumber}_chart.png" alt="Chart ${chartNumber}">
        </div>
        <div class="confidence-scale">
          <p>How confident are you in your answer?</p>
          <div class="likert-horizontal">${confidenceOptions}</div>
          <div class="likert-labels">
            <span>Not confident</span>
            <span>Very confident</span>
          </div>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn">Next</button>
  `;
  container.appendChild(confidenceStep);
  steps.push(confidenceStep);

  // --- Step 3: Text input ---
  const textStep = document.createElement('section');
  textStep.classList.add('step');

  textStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-heading">
        <div>Line Chart <span class="highlight">${chartNumber}</span> of ${totalCharts}</div>
        <div>Task <span class="highlight">3</span> of 3</div>
      </div>
      <div class="study-container">
        <div class="chart-container">
          <img src="../images/${chartNumber}_chart.png" alt="Chart ${chartNumber}">
        </div>
        <div class="study-text">
          <p>Describe the pattern in the chart below:</p>
          <textarea id="response${i}" name="response${i}" rows="4" cols="50" required></textarea>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn">Next</button>
  `;
  container.appendChild(textStep);
  steps.push(textStep);
}

// Final "Thank You" screen
const finalSection = document.createElement('section');
finalSection.classList.add('step');
finalSection.innerHTML = `
  <h1>Thank You!</h1>
  <br>
  <p>You have completed the study.</p>
`;
container.appendChild(finalSection);
steps.push(finalSection);

// Navigation
function getStepDuration(index) {
  const type = index % 3;
  return type === 2 ? 15 : 10;
}

function startTimer(index) {
  timeLeft = getStepDuration(index);
  timerDisplay.textContent = `Time Left: ${timeLeft.toFixed(1)}s`;
  timer = setInterval(() => {
    timeLeft -= 0.1;
    timerDisplay.textContent = `Time Left: ${timeLeft.toFixed(1)}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      moveToNextStep(index);
    }
  }, 100);
}

function moveToNextStep(index) {
  if (index >= totalSteps) {
    progressBarContainer.style.display = 'none';
    timerDisplay.style.display = 'none';
    return;
  }
  steps[index].classList.remove('active');
  steps[index + 1].classList.add('active');
  let progress = ((index + 1) / totalSteps) * 100;
  progressBar.style.width = `${progress}%`;
  startTimer(index + 1);
}

document.querySelectorAll('.start-btn').forEach((button, index) => {
  button.addEventListener('click', () => {
    clearInterval(timer);
    moveToNextStep(index);
  });
});

startTimer(0);
