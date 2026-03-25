import { renderStep1, validateStep1 } from './steps/step1.js';
import { renderStep2, validateStep2 } from './steps/step2.js';
import { renderStep3 } from './steps/step3.js';

const STEPS = [
  { label: '1. Versions',  render: renderStep1, validate: validateStep1 },
  { label: '2. Topology',  render: renderStep2, validate: validateStep2 },
  { label: '3. Generate',  render: renderStep3, validate: () => true },
];

let currentStep = 0;

const root    = document.getElementById('wizard-root');
const navList = document.getElementById('step-nav');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');

function buildNav() {
  navList.innerHTML = '';
  STEPS.forEach((step, i) => {
    const li = document.createElement('li');
    li.textContent = step.label;
    li.className = i === currentStep ? 'active' : (i < currentStep ? 'done' : '');
    navList.appendChild(li);
  });
}

function updateButtons() {
  btnBack.style.display = currentStep === 0 ? 'none' : 'inline-block';
  btnNext.textContent   = currentStep === STEPS.length - 1 ? 'Generate' : 'Next →';
  // Hide Next on step 3 (generate button is inside the step)
  btnNext.style.display = currentStep === STEPS.length - 1 ? 'none' : 'inline-block';
}

export function goTo(stepIndex) {
  currentStep = stepIndex;
  buildNav();
  updateButtons();
  root.innerHTML = '';
  STEPS[currentStep].render(root);
}

function handleNext() {
  const valid = STEPS[currentStep].validate();
  if (!valid) return;
  if (currentStep < STEPS.length - 1) {
    goTo(currentStep + 1);
  }
}

function handleBack() {
  if (currentStep > 0) {
    goTo(currentStep - 1);
  }
}

btnNext.addEventListener('click', handleNext);
btnBack.addEventListener('click', handleBack);

// Kick off
goTo(0);
