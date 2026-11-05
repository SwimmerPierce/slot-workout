/**
 * @file workoutState.js
 * @description Centralized state management for the Slot Machine Workout.
 *              Maintains exercise definitions, work/rest/set constraints, roll target counts,
 *              active roll index, roll history, session metrics, and LocalStorage persistence.
 * @dependencies None (Pure ES Module)
 * @role Application Model / Single Source of Truth for workout configuration and progress.
 */

export const WORK_TIMES = [30, 40, 50, 60, 70, 80, 90]; // 30s to 90s, step 10s
export const REST_TIMES = [15, 20, 25, 30, 35, 40, 45]; // 15s to 45s, step 5s
export const SETS_LIST = [1, 2, 3];                      // 1, 2, and 3 sets

export const DEFAULT_EXERCISES = [
  'Push-Ups',
  'Bodyweight Squats',
  'Burpees',
  'Plank Hold',
  'Mountain Climbers',
  'Jumping Jacks',
  'Walking Lunges',
  'High Knees',
  'Glute Bridges',
  'Bicycle Crunches'
];

export const PRESET_ROUTINES = {
  'Full Body Bodyweight': [
    'Push-Ups',
    'Bodyweight Squats',
    'Burpees',
    'Plank Hold',
    'Mountain Climbers',
    'Jumping Jacks',
    'Walking Lunges',
    'High Knees'
  ],
  'Core & Abs Shred': [
    'Plank Hold',
    'Bicycle Crunches',
    'Russian Twists',
    'Mountain Climbers',
    'Hollow Body Hold',
    'Dead Bug',
    'Side Plank Left',
    'Side Plank Right'
  ],
  'HIIT Cardio Burner': [
    'Burpees',
    'High Knees',
    'Jumping Jacks',
    'Skater Hops',
    'Jump Squats',
    'Shadow Boxing',
    'Mountain Climbers',
    'Tuck Jumps'
  ],
  'Dumbbell Strength': [
    'Goblet Squats',
    'Dumbbell Shoulder Press',
    'Dumbbell Bent-Over Row',
    'Dumbbell Romanian Deadlift',
    'Renegade Rows',
    'Dumbbell Floor Press',
    'Dumbbell Lunges',
    'Dumbbell Bicep Curls'
  ]
};

const STORAGE_KEY = 'slot_workout_data_v1';

export class WorkoutState {
  constructor() {
    this.title = 'Custom Slot Workout';
    this.exercises = [...DEFAULT_EXERCISES];
    this.targetRolls = 10;
    this.currentRollNumber = 0;
    this.history = [];
    this.currentRollResult = null;
    this.isCompleted = false;

    this.listeners = new Set();
    this.load();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.save();
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('Error in WorkoutState listener:', err);
      }
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
          this.exercises = parsed.exercises.filter(e => typeof e === 'string' && e.trim().length > 0);
        }
        if (typeof parsed.title === 'string' && parsed.title.trim()) {
          this.title = parsed.title.trim();
        }
        if (typeof parsed.targetRolls === 'number' && parsed.targetRolls > 0) {
          this.targetRolls = Math.min(Math.max(1, parsed.targetRolls), 100);
        }
        if (typeof parsed.currentRollNumber === 'number') {
          this.currentRollNumber = parsed.currentRollNumber;
        }
        if (Array.isArray(parsed.history)) {
          this.history = parsed.history;
        }
        if (parsed.currentRollResult) {
          this.currentRollResult = parsed.currentRollResult;
        }
        this.isCompleted = this.currentRollNumber >= this.targetRolls && this.targetRolls > 0;
      }
    } catch (err) {
      console.warn('Failed to parse stored workout state; using defaults', err);
    }
  }

  save() {
    try {
      const data = {
        title: this.title,
        exercises: this.exercises,
        targetRolls: this.targetRolls,
        currentRollNumber: this.currentRollNumber,
        history: this.history,
        currentRollResult: this.currentRollResult
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to persist workout state', err);
    }
  }

  setTitle(title) {
    this.title = (title || 'My Slot Workout').trim().slice(0, 60);
    this.notify();
  }

  setTargetRolls(count) {
    const valid = Math.min(Math.max(1, parseInt(count, 10) || 10), 100);
    this.targetRolls = valid;
    this.isCompleted = this.currentRollNumber >= this.targetRolls;
    this.notify();
  }

  addExercise(exerciseName) {
    const trimmed = (exerciseName || '').trim();
    if (!trimmed) return false;
    // Don't add duplicate if already exists (case-insensitive)
    const exists = this.exercises.some(e => e.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    this.exercises.push(trimmed);
    this.notify();
    return true;
  }

  removeExercise(index) {
    if (this.exercises.length <= 1) {
      // Must keep at least 1 exercise
      return false;
    }
    this.exercises.splice(index, 1);
    this.notify();
    return true;
  }

  updateExercise(index, newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed || index < 0 || index >= this.exercises.length) return false;
    this.exercises[index] = trimmed;
    this.notify();
    return true;
  }

  setExercises(exerciseList) {
    if (!Array.isArray(exerciseList) || exerciseList.length === 0) return false;
    const cleaned = exerciseList
      .map(e => (typeof e === 'string' ? e.trim() : ''))
      .filter(e => e.length > 0);
    if (cleaned.length === 0) return false;

    this.exercises = [...new Set(cleaned)];
    this.notify();
    return true;
  }

  loadPreset(presetName) {
    if (PRESET_ROUTINES[presetName]) {
      this.exercises = [...PRESET_ROUTINES[presetName]];
      this.title = presetName;
      this.notify();
      return true;
    }
    return false;
  }

  recordRoll(result) {
    this.currentRollNumber += 1;
    this.currentRollResult = {
      rollNumber: this.currentRollNumber,
      exercise: result.exercise,
      workTime: result.workTime,
      restTime: result.restTime,
      sets: result.sets,
      timestamp: new Date().toISOString()
    };
    this.history.unshift(this.currentRollResult);

    if (this.currentRollNumber >= this.targetRolls) {
      this.isCompleted = true;
    }

    this.notify();
    return {
      rollNumber: this.currentRollNumber,
      isCompleted: this.isCompleted
    };
  }

  resetSession() {
    this.currentRollNumber = 0;
    this.history = [];
    this.currentRollResult = null;
    this.isCompleted = false;
    this.notify();
  }

  addBonusRolls(extra = 5) {
    this.targetRolls += extra;
    this.isCompleted = this.currentRollNumber >= this.targetRolls;
    this.notify();
  }

  getRandomWorkTime() {
    return WORK_TIMES[Math.floor(Math.random() * WORK_TIMES.length)];
  }

  getRandomRestTime() {
    return REST_TIMES[Math.floor(Math.random() * REST_TIMES.length)];
  }

  getRandomSets() {
    return SETS_LIST[Math.floor(Math.random() * SETS_LIST.length)];
  }

  getRandomExercise() {
    if (this.exercises.length === 0) return 'Push-Ups';
    // Avoid exact duplicate of last roll if we have at least 2 exercises
    if (this.exercises.length > 1 && this.currentRollResult) {
      const candidates = this.exercises.filter(e => e !== this.currentRollResult.exercise);
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
    }
    return this.exercises[Math.floor(Math.random() * this.exercises.length)];
  }

  getRandomOutcome() {
    return {
      exercise: this.getRandomExercise(),
      workTime: this.getRandomWorkTime(),
      restTime: this.getRandomRestTime(),
      sets: this.getRandomSets()
    };
  }

  getTotalWorkTimeSeconds() {
    return this.history.reduce((sum, h) => sum + (h.workTime * h.sets), 0);
  }

  getTotalRestTimeSeconds() {
    return this.history.reduce((sum, h) => sum + (h.restTime * (h.sets - 1)), 0);
  }

  getTotalSets() {
    return this.history.reduce((sum, h) => sum + h.sets, 0);
  }
}
