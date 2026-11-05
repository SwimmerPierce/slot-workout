/**
 * @file main.js
 * @description Primary controller and view coordinator for the Slot Machine Workout app.
 *              Initializes state, binds slot engine, manages lever physics and keyboard shortcuts,
 *              handles modal workflows, executes interval timer runs, and handles email/link sharing.
 * @dependencies audio.js, workoutState.js, slotEngine.js, intervalTimer.js, share.js, confetti.js
 * @role Application entry point and orchestrator.
 */

import { sound } from './modules/audio.js';
import {
  WorkoutState,
  WORK_TIMES,
  REST_TIMES,
  SETS_LIST,
  PRESET_ROUTINES
} from './modules/workoutState.js';
import { SlotEngine } from './modules/slotEngine.js';
import { IntervalTimer } from './modules/intervalTimer.js';
import {
  generateShareUrl,
  parseSharedUrl,
  generateMailtoUri,
  copyToClipboard
} from './modules/share.js';
import { ConfettiCannon } from './modules/confetti.js';

// Instantiate Application Singletons
const state = new WorkoutState();
let confetti = null;
let slotEngine = null;
let intervalTimer = null;

// DOM Element Cache
const dom = {
  // Header
  btnOpenExercises: document.getElementById('btn-open-exercises'),
  headerExerciseCount: document.getElementById('header-exercise-count'),
  btnOpenShare: document.getElementById('btn-open-share'),
  btnToggleSound: document.getElementById('btn-toggle-sound'),
  soundIcon: document.getElementById('sound-icon'),
  btnResetSession: document.getElementById('btn-reset-session'),

  // Marquee
  currentWorkoutTitle: document.getElementById('current-workout-title'),
  btnEditTitle: document.getElementById('btn-edit-title'),
  statCurrentRoll: document.getElementById('stat-current-roll'),
  statTargetRolls: document.getElementById('stat-target-rolls'),
  statRemainingRolls: document.getElementById('stat-remaining-rolls'),
  progressBarFill: document.getElementById('progress-bar-fill'),

  // Slot Machine
  reels: [
    document.getElementById('reel-exercise'),
    document.getElementById('reel-work'),
    document.getElementById('reel-rest'),
    document.getElementById('reel-sets')
  ],
  leverAssembly: document.getElementById('lever-assembly'),
  btnSpin: document.getElementById('btn-spin'),
  deckStatusMessage: document.getElementById('deck-status-message'),

  // Rolled Outcome Card
  outcomeCard: document.getElementById('active-outcome-card'),
  outcomeRollTag: document.getElementById('outcome-roll-tag'),
  outcomeExerciseName: document.getElementById('outcome-exercise-name'),
  outcomeWorkVal: document.getElementById('outcome-work-val'),
  outcomeRestVal: document.getElementById('outcome-rest-val'),
  outcomeSetsVal: document.getElementById('outcome-sets-val'),
  btnStartTimer: document.getElementById('btn-start-timer'),
  btnManualDone: document.getElementById('btn-manual-done'),

  // History
  historyCount: document.getElementById('history-count'),
  historyList: document.getElementById('history-list'),

  // Modals - Exercises
  modalExercises: document.getElementById('modal-exercises'),
  btnCloseExerciseModal: document.getElementById('btn-close-exercise-modal'),
  inputTargetRolls: document.getElementById('input-target-rolls'),
  presetsContainer: document.getElementById('presets-container'),
  formAddExercise: document.getElementById('form-add-exercise'),
  inputNewExercise: document.getElementById('input-new-exercise'),
  modalExerciseCount: document.getElementById('modal-exercise-count'),
  exerciseItemsList: document.getElementById('exercise-items-list'),
  btnRestoreDefaults: document.getElementById('btn-restore-defaults'),
  btnSaveExercises: document.getElementById('btn-save-exercises'),

  // Modals - Share
  modalShare: document.getElementById('modal-share'),
  btnCloseShareModal: document.getElementById('btn-close-share-modal'),
  sharePreviewTitle: document.getElementById('share-preview-title'),
  sharePreviewTarget: document.getElementById('share-preview-target'),
  sharePreviewCount: document.getElementById('share-preview-count'),
  sharePreviewTags: document.getElementById('share-preview-tags'),
  btnSendEmail: document.getElementById('btn-send-email'),
  shareUrlInput: document.getElementById('share-url-input'),
  btnCopyShareUrl: document.getElementById('btn-copy-share-url'),
  copyBtnText: document.getElementById('copy-btn-text'),
  btnDoneSharing: document.getElementById('btn-done-sharing'),

  // Modals - Celebration
  modalCelebration: document.getElementById('modal-celebration'),
  celebTargetCount: document.getElementById('celeb-target-count'),
  celebRollsDone: document.getElementById('celeb-rolls-done'),
  celebTotalSets: document.getElementById('celeb-total-sets'),
  celebTotalWork: document.getElementById('celeb-total-work'),
  celebTotalRest: document.getElementById('celeb-total-rest'),
  btnCelebRestart: document.getElementById('btn-celeb-restart'),
  btnCelebBonus: document.getElementById('btn-celeb-bonus'),
  btnCelebShare: document.getElementById('btn-celeb-share'),

  // Timer Overlay
  timerOverlay: document.getElementById('timer-overlay'),

  // Toasts & Canvas
  toastContainer: document.getElementById('toast-container'),
  confettiCanvas: document.getElementById('confetti-canvas')
};

/**
 * Toast Notification System
 */
function showToast(message, type = 'default', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * App Initialization
 */
function initApp() {
  // 1. Initialize Confetti
  confetti = new ConfettiCannon(dom.confettiCanvas);

  // 2. Check for shared URL workout configuration
  const sharedData = parseSharedUrl();
  if (sharedData) {
    state.setTitle(sharedData.title);
    state.setExercises(sharedData.exercises);
    state.setTargetRolls(sharedData.targetRolls);
    state.resetSession();
    showToast(`Loaded shared workout: "${sharedData.title}" (${sharedData.exercises.length} exercises)!`, 'success', 4500);
  }

  // 3. Initialize Sound Toggle state
  updateSoundIcon();

  // 4. Initialize Slot Machine Engine
  slotEngine = new SlotEngine({
    reelElements: dom.reels,
    onSpinStart: handleSpinStart,
    onReelStop: handleReelStop,
    onSpinComplete: handleSpinComplete
  });

  // Populate initial reel viewports
  const initialEx = state.currentRollResult?.exercise || state.exercises[0];
  const initialWork = state.currentRollResult?.workTime || 40;
  const initialRest = state.currentRollResult?.restTime || 20;
  const initialSets = state.currentRollResult?.sets || 2;

  slotEngine.initReelItems(0, state.exercises, initialEx);
  slotEngine.initReelItems(1, WORK_TIMES, initialWork);
  slotEngine.initReelItems(2, REST_TIMES, initialRest);
  slotEngine.initReelItems(3, SETS_LIST, initialSets);

  // 5. Initialize Interval Companion Timer
  intervalTimer = new IntervalTimer({
    container: dom.timerOverlay,
    onComplete: handleIntervalTimerComplete,
    onDismiss: () => {
      showToast('Interval timer exited', 'default', 2000);
    }
  });

  // 6. Bind Event Listeners
  bindEvents();

  // 7. Render UI state
  renderPresets();
  renderState(state);

  // If there is an existing roll result from session storage, display it
  if (state.currentRollResult) {
    displayRolledChallenge(state.currentRollResult);
  }
}

/**
 * Event Listeners Registration
 */
function bindEvents() {
  // Spin button & lever
  dom.btnSpin.addEventListener('click', triggerSpin);
  if (dom.leverAssembly) {
    dom.leverAssembly.addEventListener('click', triggerLeverPull);
  }

  // Title edit
  dom.btnEditTitle.addEventListener('click', () => {
    const newTitle = prompt('Rename this workout routine:', state.title);
    if (newTitle && newTitle.trim()) {
      state.setTitle(newTitle);
      showToast('Workout title updated!', 'success');
    }
  });

  // Sound toggle
  dom.btnToggleSound.addEventListener('click', () => {
    const muted = sound.toggleMute();
    updateSoundIcon();
    showToast(muted ? 'Sound Muted' : 'Sound Enabled', 'default', 2000);
  });

  // Session reset
  dom.btnResetSession.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset current session rolls back to 0?')) {
      state.resetSession();
      dom.outcomeCard.classList.add('hidden');
      dom.deckStatusMessage.textContent = 'READY TO SPIN';
      showToast('Session reset to Roll 0', 'default');
    }
  });

  // Outcome card actions
  dom.btnStartTimer.addEventListener('click', () => {
    if (state.currentRollResult) {
      intervalTimer.start(state.currentRollResult);
    }
  });

  dom.btnManualDone.addEventListener('click', () => {
    dom.outcomeCard.classList.add('hidden');
    dom.deckStatusMessage.textContent = state.isCompleted ? 'WORKOUT COMPLETE!' : 'READY TO SPIN';
    showToast(`Roll #${state.currentRollNumber} marked complete!`, 'success');
  });

  // Modals - Exercise Manager
  dom.btnOpenExercises.addEventListener('click', openExerciseModal);
  dom.btnCloseExerciseModal.addEventListener('click', closeExerciseModal);
  dom.btnSaveExercises.addEventListener('click', saveExerciseModalChanges);
  dom.formAddExercise.addEventListener('submit', handleAddExerciseSubmit);
  dom.btnRestoreDefaults.addEventListener('click', () => {
    if (confirm('Restore default 10 exercises?')) {
      state.loadPreset('Full Body Bodyweight');
      renderExerciseListInModal();
      showToast('Restored default exercises', 'default');
    }
  });

  // Modals - Share
  dom.btnOpenShare.addEventListener('click', openShareModal);
  dom.btnCloseShareModal.addEventListener('click', closeShareModal);
  dom.btnDoneSharing.addEventListener('click', closeShareModal);
  dom.btnCopyShareUrl.addEventListener('click', handleCopyShareUrl);

  // Modals - Celebration
  dom.btnCelebRestart.addEventListener('click', () => {
    state.resetSession();
    closeCelebrationModal();
    showToast('New session started! Good luck!', 'success');
  });

  dom.btnCelebBonus.addEventListener('click', () => {
    state.addBonusRolls(5);
    closeCelebrationModal();
    showToast('Added 5 bonus rolls to your workout!', 'accent');
  });

  dom.btnCelebShare.addEventListener('click', () => {
    closeCelebrationModal();
    openShareModal();
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts if user is typing in an input field
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.code === 'Space') {
      e.preventDefault();
      dom.btnSpin.classList.add('pressed');
      triggerSpin();
      setTimeout(() => dom.btnSpin.classList.remove('pressed'), 150);
    } else if (e.code === 'KeyL') {
      triggerLeverPull();
    } else if (e.code === 'Escape') {
      closeAllModals();
    }
  });

  // Close modals clicking on backdrop
  [dom.modalExercises, dom.modalShare, dom.modalCelebration].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  // Subscribe to state updates
  state.subscribe((updated) => {
    renderState(updated);
  });
}

function updateSoundIcon() {
  dom.soundIcon.textContent = sound.isMuted ? '🔇' : '🔊';
  dom.btnToggleSound.classList.toggle('btn-muted', sound.isMuted);
}

/**
 * Spin Trigger Logic
 */
function triggerLeverPull() {
  if (slotEngine.isSpinning) return;
  sound.playLeverPull();

  if (dom.leverAssembly) {
    dom.leverAssembly.classList.add('pulled');
    setTimeout(() => {
      dom.leverAssembly.classList.remove('pulled');
    }, 350);
  }

  triggerSpin();
}

function triggerSpin() {
  if (slotEngine.isSpinning) return;

  // Check if workout is already done
  if (state.isCompleted) {
    if (confirm('You already completed the target rolls for this workout! Would you like to add 5 bonus rolls or restart? Click OK to add 5 bonus rolls, or Cancel to restart.')) {
      state.addBonusRolls(5);
    } else {
      state.resetSession();
    }
  }

  const outcome = state.getRandomOutcome();
  const availablePools = {
    exercises: state.exercises,
    workTimes: WORK_TIMES,
    restTimes: REST_TIMES,
    setsList: SETS_LIST
  };

  dom.btnSpin.disabled = true;
  dom.outcomeCard.classList.add('hidden');

  slotEngine.spin(outcome, availablePools)
    .catch(err => console.error('Spin error:', err));
}

function handleSpinStart() {
  dom.deckStatusMessage.textContent = 'SPINNING REELS...';
}

function handleReelStop(reelIndex, value) {
  const labels = ['Exercise', 'Work Time', 'Rest Time', 'Sets'];
  dom.deckStatusMessage.textContent = `LOCKED ${labels[reelIndex].toUpperCase()}!`;
}

function handleSpinComplete(outcome) {
  dom.btnSpin.disabled = false;
  dom.deckStatusMessage.textContent = 'LOCKED & LOADED!';

  // Record roll in state
  const rollInfo = state.recordRoll(outcome);

  // Display outcome card
  displayRolledChallenge(outcome);

  // If completed target rolls, celebrate!
  if (rollInfo.isCompleted) {
    setTimeout(() => {
      triggerJackpotCelebration();
    }, 700);
  }
}

function displayRolledChallenge(outcome) {
  dom.outcomeExerciseName.textContent = outcome.exercise;
  dom.outcomeWorkVal.textContent = `${outcome.workTime}s`;
  dom.outcomeRestVal.textContent = `${outcome.restTime}s`;
  dom.outcomeSetsVal.textContent = `${outcome.sets} ${outcome.sets === 1 ? 'Set' : 'Sets'}`;
  dom.outcomeRollTag.textContent = `Roll #${state.currentRollNumber} of ${state.targetRolls}`;

  dom.outcomeCard.classList.remove('hidden');
}

/**
 * Interactive Timer Completion Handler
 */
function handleIntervalTimerComplete(rollData) {
  showToast(`Great work! Finished ${rollData.exercise} (${rollData.sets} sets)!`, 'success', 4000);
  dom.outcomeCard.classList.add('hidden');
  dom.deckStatusMessage.textContent = state.isCompleted ? 'WORKOUT COMPLETE!' : 'READY FOR NEXT SPIN';

  if (state.isCompleted) {
    triggerJackpotCelebration();
  }
}

/**
 * Jackpot / Workout Completion Celebration
 */
function triggerJackpotCelebration() {
  sound.playJackpotFanfare();
  confetti.fire(150);

  // Fire second burst after 600ms
  setTimeout(() => confetti.fire(120), 600);

  dom.celebTargetCount.textContent = state.targetRolls;
  dom.celebRollsDone.textContent = state.currentRollNumber;
  dom.celebTotalSets.textContent = state.getTotalSets();

  const totalWorkSec = state.getTotalWorkTimeSeconds();
  const workMins = Math.floor(totalWorkSec / 60);
  const workSecs = totalWorkSec % 60;
  dom.celebTotalWork.textContent = `${workMins}m ${workSecs}s`;

  const totalRestSec = state.getTotalRestTimeSeconds();
  const restMins = Math.floor(totalRestSec / 60);
  const restSecs = totalRestSec % 60;
  dom.celebTotalRest.textContent = `${restMins}m ${restSecs}s`;

  dom.modalCelebration.classList.remove('hidden');
}

function closeCelebrationModal() {
  dom.modalCelebration.classList.add('hidden');
  confetti.stop();
}

/**
 * State Rendering to DOM
 */
function renderState(s) {
  // Title
  dom.currentWorkoutTitle.textContent = s.title;

  // Header Exercise Count
  dom.headerExerciseCount.textContent = s.exercises.length;

  // Marquee stats
  dom.statCurrentRoll.textContent = s.currentRollNumber;
  dom.statTargetRolls.textContent = s.targetRolls;
  const remaining = Math.max(0, s.targetRolls - s.currentRollNumber);
  dom.statRemainingRolls.textContent = remaining;

  // Progress Bar
  const pct = s.targetRolls > 0
    ? Math.min(100, Math.round((s.currentRollNumber / s.targetRolls) * 100))
    : 0;
  dom.progressBarFill.style.width = `${pct}%`;

  // History list
  renderHistory(s.history);
}

function renderHistory(history) {
  dom.historyCount.textContent = history.length;

  if (history.length === 0) {
    dom.historyList.innerHTML = `<div class="history-empty">No rolls completed yet. Pull the lever or hit SPIN to begin!</div>`;
    return;
  }

  dom.historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="hist-left">
        <span class="hist-number">#${item.rollNumber}</span>
        <span class="hist-name">${item.exercise}</span>
      </div>
      <div class="hist-specs">
        <span class="hist-tag">${item.workTime}s work</span>
        <span class="hist-tag">${item.restTime}s rest</span>
        <span class="hist-tag">${item.sets} ${item.sets === 1 ? 'set' : 'sets'}</span>
      </div>
    </div>
  `).join('');
}

/**
 * Exercise Manager Modal Functions
 */
function openExerciseModal() {
  dom.inputTargetRolls.value = state.targetRolls;
  renderExerciseListInModal();
  dom.modalExercises.classList.remove('hidden');
  dom.inputNewExercise.focus();
}

function closeExerciseModal() {
  dom.modalExercises.classList.add('hidden');
}

function renderPresets() {
  dom.presetsContainer.innerHTML = Object.keys(PRESET_ROUTINES).map(name => `
    <button type="button" class="btn-preset" data-preset="${name}">${name}</button>
  `).join('');

  dom.presetsContainer.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const pName = btn.dataset.preset;
      state.loadPreset(pName);
      renderExerciseListInModal();
      showToast(`Loaded "${pName}" preset!`, 'accent');
    });
  });
}

function renderExerciseListInModal() {
  dom.modalExerciseCount.textContent = state.exercises.length;
  dom.exerciseItemsList.innerHTML = state.exercises.map((ex, idx) => `
    <li class="exercise-item-row">
      <span class="exercise-item-title">${ex}</span>
      <div class="exercise-item-actions">
        <button type="button" class="btn-del-item" data-index="${idx}" title="Remove exercise" ${state.exercises.length <= 1 ? 'disabled style="opacity:0.3"' : ''}>&times;</button>
      </div>
    </li>
  `).join('');

  dom.exerciseItemsList.querySelectorAll('.btn-del-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.index, 10);
      if (state.removeExercise(idx)) {
        renderExerciseListInModal();
      } else {
        showToast('You must have at least one exercise in the machine!', 'default');
      }
    });
  });
}

function handleAddExerciseSubmit(e) {
  e.preventDefault();
  const name = dom.inputNewExercise.value;
  if (state.addExercise(name)) {
    dom.inputNewExercise.value = '';
    renderExerciseListInModal();
    showToast(`Added "${name}" to exercise pool!`, 'success');
  } else {
    showToast('Exercise is empty or already in the list!', 'default');
  }
}

function saveExerciseModalChanges() {
  const targetVal = parseInt(dom.inputTargetRolls.value, 10);
  if (targetVal > 0) {
    state.setTargetRolls(targetVal);
  }

  // Update reel 1 with latest exercises
  const currentEx = state.currentRollResult?.exercise || state.exercises[0];
  slotEngine.initReelItems(0, state.exercises, currentEx);

  closeExerciseModal();
  showToast('Exercise roller updated with your custom routine!', 'success');
}

/**
 * Share & Email Modal Functions
 */
function openShareModal() {
  const shareUrl = generateShareUrl(state);

  dom.sharePreviewTitle.textContent = state.title;
  dom.sharePreviewTarget.textContent = `${state.targetRolls} rounds`;
  dom.sharePreviewCount.textContent = state.exercises.length;

  dom.sharePreviewTags.innerHTML = state.exercises.map(ex => `
    <span class="preview-tag-item">${ex}</span>
  `).join('');

  dom.shareUrlInput.value = shareUrl;

  // Format email mailto link
  const mailtoUri = generateMailtoUri({
    title: state.title,
    exercises: state.exercises,
    targetRolls: state.targetRolls,
    shareUrl: shareUrl
  });
  dom.btnSendEmail.setAttribute('href', mailtoUri);

  dom.copyBtnText.textContent = 'Copy';
  dom.modalShare.classList.remove('hidden');
}

function closeShareModal() {
  dom.modalShare.classList.add('hidden');
}

async function handleCopyShareUrl() {
  const url = dom.shareUrlInput.value;
  const copied = await copyToClipboard(url);
  if (copied) {
    dom.copyBtnText.textContent = 'Copied!';
    showToast('Share link copied to clipboard!', 'success');
    setTimeout(() => {
      dom.copyBtnText.textContent = 'Copy';
    }, 2500);
  } else {
    // Select input for manual copy
    dom.shareUrlInput.select();
    showToast('Press Ctrl+C to copy', 'default');
  }
}

function closeAllModals() {
  dom.modalExercises.classList.add('hidden');
  dom.modalShare.classList.add('hidden');
  dom.modalCelebration.classList.add('hidden');
  confetti.stop();
}

// Bootstrap on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
