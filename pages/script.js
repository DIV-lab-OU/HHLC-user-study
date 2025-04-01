const totalCharts = 45; // Number of unique charts
const totalSteps = totalCharts * 2; // Each chart appears twice
const container = document.body;
let timer;
let timeLeft;
let phase = 0; // Track current phase (0 = 10s, 1 = 15s)
let currentStep = 0;

// Create Progress Indicator
const progressIndicator = document.createElement('div');
progressIndicator.id = "progress-indicator";
progressIndicator.textContent = `Chart 1 of ${totalCharts}`;
container.insertBefore(progressIndicator, container.firstChild);

// Create Timer Display
const timerDisplay = document.createElement('p');
timerDisplay.id = "timer";
container.insertBefore(timerDisplay, container.firstChild);

// Create Sections Dynamically
const steps = [];
for (let i = 0; i < totalSteps; i++) {
    const section = document.createElement('section');
    section.classList.add('step');
    if (i === 0) section.classList.add('active'); // First step is active

    let chartNumber = Math.floor(i / 2) + 1; // Ensures same chart appears twice

    let questionHTML = `
        <h1 class="chart-heading">Line Chart ${chartNumber}</h1>
        <div class="study-container">
            <div class="chart-container">
                <img src="../images/${chartNumber}_chart.png" alt="Chart ${chartNumber}">
            </div>`;

    if (i % 2 === 0) {
        // Odd-indexed steps (first appearance of chart) → Radio button format
        questionHTML += `
        <div class="study">
            <div class="study-radio">
                <p>What trend do you see in the line chart?</p>
                <label><input type="radio" name="trend${i}" value="Upward"> Upward</label>
                <label><input type="radio" name="trend${i}" value="Downward"> Downward</label>
                <label><input type="radio" name="trend${i}" value="Irregular"> Irregular</label>
                <label><input type="radio" name="trend${i}" value="Uniform"> Uniform</label>
                <label><input type="radio" name="trend${i}" value="Peak/Valley"> Peak/Valley</label>
            </div>
            <br>
            <div class="confidence-scale" style="margin-top: 25px;">
  <p>How confident are you in your answer?</p>
  
  <div class="likert-horizontal">
    <label><input type="radio" name="confidence${i}" value="1"> 1</label>
    <label><input type="radio" name="confidence${i}" value="2"> 2</label>
    <label><input type="radio" name="confidence${i}" value="3"> 3</label>
    <label><input type="radio" name="confidence${i}" value="4"> 4</label>
    <label><input type="radio" name="confidence${i}" value="5"> 5</label>
  </div>
  <div class="likert-labels">
    <span>Not confident</span>
    <span>Very confident</span>
  </div>
  </div>
</div>`;
    } else {
        // Even-indexed steps (second appearance of chart) → Text input format
        questionHTML += `
            <div class="study-text">
                <p>Describe the pattern in the chart below:</p>
                <textarea id="response${i}" name="response${i}" rows="4" cols="50" required></textarea>
            </div>`;
    }

    questionHTML += `
        </div>
        <br>
        <button class="next-btn">Next</button>`;

    section.innerHTML = questionHTML;
    container.appendChild(section);
    steps.push(section);
}

// Create Final "Thank You" Section
const finalSection = document.createElement('section');
finalSection.classList.add('step');
finalSection.innerHTML = `
    <h1>Thank You!</h1>
    <br>
    <p>You have completed the study.</p>
`;
container.appendChild(finalSection);
steps.push(finalSection);

// Attach Event Listeners for Navigation
document.querySelectorAll('.next-btn').forEach((button, index) => {
    button.addEventListener('click', () => {
        clearInterval(timer); // Stop the timer if manually clicking Next
        moveToNextStep(index);
    });
});

function startTimer(index) {
    timeLeft = phase === 0 ? 10.0 : 15.0; // Alternate between 10s and 15s
    phase = 1 - phase; // Toggle phase (0 → 1, 1 → 0)

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
        progressIndicator.style.display = 'none';
        return;
    }

    steps[index].classList.remove('active');
    steps[index + 1].classList.add('active');

    let chartNum = Math.ceil((index + 2) / 2);
    progressIndicator.textContent = `Chart ${chartNum} of ${totalCharts}`;

    startTimer(index + 1);
}

// Start the timer on the first step
startTimer(0);
