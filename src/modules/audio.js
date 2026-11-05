/**
 * @file audio.js
 * @description Procedural Web Audio API sound generator for the Slot Machine Workout.
 *              Synthesizes arcade mechanical clicks, reel spinning ratchets, reel stops,
 *              interval countdown beeps, and jackpot celebration fanfares with zero external audio assets.
 * @dependencies Web Audio API (native browser AudioContext)
 * @role Audio engine providing tactile auditory feedback and workout interval cues.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('slot_workout_muted') === 'true';
    this.spinInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('slot_workout_muted', String(this.isMuted));
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('slot_workout_muted', String(this.isMuted));
  }

  playLeverPull() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  startSpinRattle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.stopSpinRattle();

    let count = 0;
    this.spinInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = count % 2 === 0 ? 'sine' : 'triangle';
      const pitch = 220 + (count % 4) * 30;
      osc.frequency.setValueAtTime(pitch, t);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
      count++;
    }, 70);
  }

  stopSpinRattle() {
    if (this.spinInterval) {
      clearInterval(this.spinInterval);
      this.spinInterval = null;
    }
  }

  playReelStop(reelIndex = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Ascending pitch for sequential reel stops: Reel 1 (300Hz) -> Reel 4 (540Hz)
    const baseFreq = 300 + reelIndex * 80;
    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);

    // Add mechanical clunk thump
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(100, t);
    thump.frequency.exponentialRampToValueAtTime(30, t + 0.07);

    thumpGain.gain.setValueAtTime(0.25, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    thump.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);

    thump.start(t);
    thump.stop(t + 0.09);
  }

  playSpinCompleteChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    chords.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  playTimerCountdown(isFinal = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = isFinal ? 880 : 440; // High tone for GO!, lower for 3, 2, 1
    const dur = isFinal ? 0.3 : 0.12;

    osc.type = isFinal ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(isFinal ? 0.25 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  playRestChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  playJackpotFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12, offset: 0.0 },   // C5
      { f: 659.25, d: 0.12, offset: 0.12 },  // E5
      { f: 783.99, d: 0.12, offset: 0.24 },  // G5
      { f: 1046.5, d: 0.28, offset: 0.36 },  // C6
      { f: 783.99, d: 0.12, offset: 0.65 },  // G5
      { f: 1046.5, d: 0.55, offset: 0.78 }   // C6 held
    ];

    notes.forEach(note => {
      const t = this.ctx.currentTime + note.offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.05);
    });
  }
}

export const sound = new SoundEngine();
