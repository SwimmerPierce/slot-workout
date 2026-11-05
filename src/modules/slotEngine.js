/**
 * @file slotEngine.js
 * @description 4-Reel mechanical slot machine animation and physics engine.
 *              Controls reel strip rendering, high-speed vertical spinning, sequential braking,
 *              overshoot bounce physics, and reel stopping events.
 * @dependencies audio.js (sound effects for reel spin and individual reel locks)
 * @role Physics and visual rendering engine for the 4 physical workout rollers.
 */

import { sound } from './audio.js';

export class SlotEngine {
  /**
   * @param {Object} options
   * @param {HTMLElement[]} options.reelElements - Array of 4 reel viewport elements
   * @param {Function} options.onSpinStart - Callback when spinning commences
   * @param {Function} options.onReelStop - Callback when an individual reel stops (index, value)
   * @param {Function} options.onSpinComplete - Callback when all 4 reels lock in
   */
  constructor(options) {
    this.reels = options.reelElements; // Array of 4 reel DOM containers
    this.onSpinStart = options.onSpinStart || (() => {});
    this.onReelStop = options.onReelStop || (() => {});
    this.onSpinComplete = options.onSpinComplete || (() => {});

    this.isSpinning = false;
    this.reelStrips = [];
    this.currentValues = [null, null, null, null];

    this.setupReels();
  }

  setupReels() {
    this.reels.forEach((reelEl, index) => {
      let strip = reelEl.querySelector('.reel-strip');
      if (!strip) {
        strip = document.createElement('div');
        strip.className = 'reel-strip';
        reelEl.innerHTML = '';
        reelEl.appendChild(strip);
      }
      this.reelStrips[index] = strip;
    });
  }

  /**
   * Populates a reel with initial items
   * @param {number} reelIndex
   * @param {Array<string|number>} items
   * @param {string|number} initialValue
   */
  initReelItems(reelIndex, items, initialValue = null) {
    const strip = this.reelStrips[reelIndex];
    if (!strip) return;

    const valueToShow = initialValue !== null ? initialValue : items[0];
    this.currentValues[reelIndex] = valueToShow;

    strip.innerHTML = '';
    const itemEl = document.createElement('div');
    itemEl.className = 'reel-item active';
    itemEl.innerHTML = this.formatDisplayValue(reelIndex, valueToShow);
    strip.appendChild(itemEl);
    strip.style.transform = 'translateY(0px)';
  }

  formatDisplayValue(reelIndex, val) {
    if (reelIndex === 0) {
      // Exercise
      return `<span class="reel-text exercise-text">${this.escapeHtml(String(val))}</span>`;
    } else if (reelIndex === 1) {
      // Work Time
      return `<span class="reel-number">${val}</span><span class="reel-unit">SEC WORK</span>`;
    } else if (reelIndex === 2) {
      // Rest Time
      return `<span class="reel-number">${val}</span><span class="reel-unit">SEC REST</span>`;
    } else if (reelIndex === 3) {
      // Sets
      return `<span class="reel-number">${val}</span><span class="reel-unit">${val === 1 ? 'SET' : 'SETS'}</span>`;
    }
    return String(val);
  }

  escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  /**
   * Initiates a 4-reel spin to landing targets
   * @param {Object} outcome - { exercise, workTime, restTime, sets }
   * @param {Object} availablePools - { exercises, workTimes, restTimes, setsList }
   * @returns {Promise<Object>} resolves with outcome once all reels stop
   */
  spin(outcome, availablePools) {
    if (this.isSpinning) return Promise.reject(new Error('Already spinning'));

    this.isSpinning = true;
    this.onSpinStart();
    sound.startSpinRattle();

    const targets = [
      outcome.exercise,
      outcome.workTime,
      outcome.restTime,
      outcome.sets
    ];

    const pools = [
      availablePools.exercises,
      availablePools.workTimes,
      availablePools.restTimes,
      availablePools.setsList
    ];

    // Configure reel spin sequence timings (milliseconds)
    const baseDuration = 1600;
    const reelStagger = 500; // sequential stop every 500ms

    const promises = this.reels.map((reelEl, index) => {
      const duration = baseDuration + index * reelStagger;
      const targetVal = targets[index];
      const pool = pools[index];
      return this.spinSingleReel(index, targetVal, pool, duration);
    });

    return Promise.all(promises).then(() => {
      sound.stopSpinRattle();
      sound.playSpinCompleteChime();
      this.isSpinning = false;
      this.currentValues = [...targets];
      this.onSpinComplete(outcome);
      return outcome;
    });
  }

  /**
   * Animates a single reel cylinder
   */
  spinSingleReel(reelIndex, targetValue, itemPool, duration) {
    return new Promise((resolve) => {
      const strip = this.reelStrips[reelIndex];
      const reelEl = this.reels[reelIndex];
      const itemHeight = reelEl.clientHeight || 120;

      // Build animation strip:
      // Start with current displayed item
      // + 20 to 30 randomized blur items
      // + final landing target item
      const repeats = Math.max(18, Math.floor(duration / 90));
      const sequence = [];

      // Current visible value first
      sequence.push(this.currentValues[reelIndex] || itemPool[0]);

      for (let i = 0; i < repeats; i++) {
        const rand = itemPool[Math.floor(Math.random() * itemPool.length)];
        sequence.push(rand);
      }

      // Final landing target
      sequence.push(targetValue);

      // Render the sequence into DOM
      strip.innerHTML = sequence.map((val, idx) => {
        const isLast = idx === sequence.length - 1;
        return `<div class="reel-item ${isLast ? 'target-item' : ''}" style="height:${itemHeight}px">
          ${this.formatDisplayValue(reelIndex, val)}
        </div>`;
      }).join('');

      // Reset strip transform to top
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0px)';
      reelEl.classList.add('spinning');

      // Force browser reflow
      void strip.offsetHeight;

      // Distance to scroll to target
      const targetOffset = (sequence.length - 1) * itemHeight;

      // Cubic-bezier simulating realistic mechanical deceleration with gentle brake bounce
      strip.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.82, 0.22, 1.05)`;
      strip.style.transform = `translateY(-${targetOffset}px)`;

      // Timeout for reel stop completion
      setTimeout(() => {
        reelEl.classList.remove('spinning');
        sound.playReelStop(reelIndex);

        // Snap and trim to just the active item
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0px)';
        strip.innerHTML = `<div class="reel-item active" style="height:${itemHeight}px">
          ${this.formatDisplayValue(reelIndex, targetValue)}
        </div>`;

        this.currentValues[reelIndex] = targetValue;
        this.onReelStop(reelIndex, targetValue);

        // Small visual bounce effect on container
        reelEl.classList.add('reel-lock');
        setTimeout(() => reelEl.classList.remove('reel-lock'), 250);

        resolve(targetValue);
      }, duration);
    });
  }

  getCurrentValues() {
    return {
      exercise: this.currentValues[0],
      workTime: this.currentValues[1],
      restTime: this.currentValues[2],
      sets: this.currentValues[3]
    };
  }
}
