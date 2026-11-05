/**
 * @file intervalTimer.js
 * @description Guided workout execution timer for the rolled exercise, work interval,
 *              rest interval, and set count. Provides live visual countdowns, phase transitions,
 *              and synchronized audio cues.
 * @dependencies audio.js (interval countdown beeps and phase chimes)
 * @role Interactive training companion executing the slot machine's rolled directives.
 */

import { sound } from './audio.js';

export class IntervalTimer {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Modal or container element
   * @param {Function} options.onComplete - Callback when all sets of the rolled round finish
   * @param {Function} options.onDismiss - Callback when user closes or skips the timer
   */
  constructor(options) {
    this.container = options.container;
    this.onComplete = options.onComplete || (() => {});
    this.onDismiss = options.onDismiss || (() => {});

    this.timerId = null;
    this.state = 'idle'; // 'countdown', 'work', 'rest', 'paused', 'finished'
    this.currentSet = 1;
    this.totalSets = 1;
    this.remainingSeconds = 0;
    this.totalPhaseSeconds = 0;
    this.isPaused = false;
    this.currentRoundData = null;

    this.bindElements();
  }

  bindElements() {
    this.elExerciseName = this.container.querySelector('#timer-exercise-name');
    this.elPhaseTitle = this.container.querySelector('#timer-phase-title');
    this.elSetBadge = this.container.querySelector('#timer-set-badge');
    this.elCountdown = this.container.querySelector('#timer-countdown');
    this.elProgressBar = this.container.querySelector('#timer-progress-fill');
    this.btnPause = this.container.querySelector('#btn-timer-pause');
    this.btnSkip = this.container.querySelector('#btn-timer-skip');
    this.btnClose = this.container.querySelector('#btn-timer-close');

    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => this.togglePause());
    }
    if (this.btnSkip) {
      this.btnSkip.addEventListener('click', () => this.skipPhase());
    }
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.stop(true));
    }
  }

  start(rollResult) {
    this.stop(false);
    this.currentRoundData = rollResult;
    this.currentSet = 1;
    this.totalSets = rollResult.sets;
    this.isPaused = false;

    if (this.btnPause) {
      this.btnPause.innerHTML = `<span class="icon">⏸</span> Pause`;
    }

    if (this.elExerciseName) {
      this.elExerciseName.textContent = rollResult.exercise;
    }

    this.container.classList.remove('hidden');
    this.container.classList.add('active');

    // Start with 3-second Get Ready countdown
    this.startCountdownPhase();
  }

  startCountdownPhase() {
    this.state = 'countdown';
    this.remainingSeconds = 3;
    this.totalPhaseSeconds = 3;

    if (this.elPhaseTitle) {
      this.elPhaseTitle.textContent = 'GET READY';
      this.elPhaseTitle.className = 'phase-title phase-countdown';
    }
    this.updateSetDisplay();
    this.updateDisplay();

    sound.playTimerCountdown(false);

    this.runTickLoop(() => {
      this.startWorkPhase();
    });
  }

  startWorkPhase() {
    this.state = 'work';
    this.remainingSeconds = this.currentRoundData.workTime;
    this.totalPhaseSeconds = this.currentRoundData.workTime;

    if (this.elPhaseTitle) {
      this.elPhaseTitle.textContent = 'WORK';
      this.elPhaseTitle.className = 'phase-title phase-work';
    }
    this.updateSetDisplay();
    this.updateDisplay();

    sound.playTimerCountdown(true); // High start tone

    this.runTickLoop(() => {
      // Check if more sets remain
      if (this.currentSet < this.totalSets) {
        this.startRestPhase();
      } else {
        this.finishRound();
      }
    });
  }

  startRestPhase() {
    this.state = 'rest';
    this.remainingSeconds = this.currentRoundData.restTime;
    this.totalPhaseSeconds = this.currentRoundData.restTime;

    if (this.elPhaseTitle) {
      this.elPhaseTitle.textContent = 'REST';
      this.elPhaseTitle.className = 'phase-title phase-rest';
    }
    this.updateSetDisplay();
    this.updateDisplay();

    sound.playRestChime();

    this.runTickLoop(() => {
      this.currentSet += 1;
      this.startWorkPhase();
    });
  }

  finishRound() {
    this.state = 'finished';
    this.clearTickLoop();

    if (this.elPhaseTitle) {
      this.elPhaseTitle.textContent = 'ROUND COMPLETE!';
      this.elPhaseTitle.className = 'phase-title phase-complete';
    }
    if (this.elCountdown) {
      this.elCountdown.textContent = 'DONE';
    }
    if (this.elProgressBar) {
      this.elProgressBar.style.width = '100%';
    }

    sound.playSpinCompleteChime();

    setTimeout(() => {
      this.stop(false);
      this.onComplete(this.currentRoundData);
    }, 1800);
  }

  runTickLoop(onPhaseEnd) {
    this.clearTickLoop();

    this.timerId = setInterval(() => {
      if (this.isPaused) return;

      this.remainingSeconds -= 1;
      this.updateDisplay();

      // Audio beeps for 3, 2, 1 seconds left
      if (this.remainingSeconds <= 3 && this.remainingSeconds > 0) {
        sound.playTimerCountdown(false);
      }

      if (this.remainingSeconds <= 0) {
        this.clearTickLoop();
        onPhaseEnd();
      }
    }, 1000);
  }

  clearTickLoop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  togglePause() {
    if (this.state === 'idle' || this.state === 'finished') return;
    this.isPaused = !this.isPaused;

    if (this.btnPause) {
      this.btnPause.innerHTML = this.isPaused
        ? `<span class="icon">▶</span> Resume`
        : `<span class="icon">⏸</span> Pause`;
    }
    if (this.elPhaseTitle) {
      if (this.isPaused) {
        this.elPhaseTitle.dataset.origText = this.elPhaseTitle.textContent;
        this.elPhaseTitle.textContent = 'PAUSED';
      } else {
        this.elPhaseTitle.textContent = this.elPhaseTitle.dataset.origText || this.state.toUpperCase();
      }
    }
  }

  skipPhase() {
    if (this.state === 'idle' || this.state === 'finished') return;

    if (this.state === 'countdown') {
      this.clearTickLoop();
      this.startWorkPhase();
    } else if (this.state === 'work') {
      this.clearTickLoop();
      if (this.currentSet < this.totalSets) {
        this.startRestPhase();
      } else {
        this.finishRound();
      }
    } else if (this.state === 'rest') {
      this.clearTickLoop();
      this.currentSet += 1;
      this.startWorkPhase();
    }
  }

  stop(dismiss = true) {
    this.clearTickLoop();
    this.state = 'idle';
    this.isPaused = false;
    this.container.classList.remove('active');
    this.container.classList.add('hidden');

    if (dismiss) {
      this.onDismiss();
    }
  }

  updateDisplay() {
    if (this.elCountdown) {
      const mins = Math.floor(this.remainingSeconds / 60);
      const secs = this.remainingSeconds % 60;
      this.elCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (this.elProgressBar && this.totalPhaseSeconds > 0) {
      const pct = Math.max(0, Math.min(100, ((this.totalPhaseSeconds - this.remainingSeconds) / this.totalPhaseSeconds) * 100));
      this.elProgressBar.style.width = `${pct}%`;
    }
  }

  updateSetDisplay() {
    if (this.elSetBadge) {
      this.elSetBadge.textContent = `Set ${this.currentSet} of ${this.totalSets}`;
    }
  }
}
