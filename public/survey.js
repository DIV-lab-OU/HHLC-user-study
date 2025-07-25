const participantData = { demographic: {}, responses: [] };

// Populate age dropdown
const ageDropdown = document.getElementById("age-dropdown");
for (let i = 18; i <= 65; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  ageDropdown.appendChild(opt);
}

// Show/hide "Other" profession
const professionDropdown = document.getElementById("profession-dropdown");
const otherContainer = document.getElementById("other-profession-container");
const otherInput = document.getElementById("other-profession");

professionDropdown.addEventListener('change', () => {
  otherContainer.style.display = professionDropdown.value === "Other" ? "block" : "none";
});

// Visualization familiarity scale (1–10)
const vizScale = document.getElementById("viz-scale");
for (let i = 1; i <= 10; i++) {
  const label = document.createElement("label");
  label.innerHTML = `<input type="radio" name="visualization" value="${i}"> ${i}`;
  vizScale.appendChild(label);
}

// Handle form submission
document.getElementById("next-button").addEventListener("click", () => {
  const gender = document.querySelector('input[name="gender"]:checked')?.value;
  const age = ageDropdown.value;
  const education = document.querySelector('input[name="education"]:checked')?.value;
  const visualization = document.querySelector('input[name="visualization"]:checked')?.value;
  const profession = professionDropdown.value === "Other" ? otherInput.value.trim() : professionDropdown.value;

  if (gender && age && education && visualization && profession) {
    participantData.demographic = { gender, age, education, profession, visualization };

    // Save to localStorage for access in study.html
    localStorage.setItem("participantData", JSON.stringify(participantData));

    // Move to chart-based study
    window.location.href = "study.html";
  } else {
    alert("Please fill in all required fields.");
  }
});
