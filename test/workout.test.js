/**
 * @file workout.test.js
 * @description Automated unit test suite verifying workout constraints,
 *              interval sequences, sets ranges, state mutations, and link serialization.
 * @dependencies src/modules/workoutState.js, src/modules/share.js
 * @role Automated test harness.
 */

import assert from 'node:assert/strict';
import {
  WorkoutState,
  WORK_TIMES,
  REST_TIMES,
  SETS_LIST
} from '../src/modules/workoutState.js';

// Mock localStorage and window for Node environment
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

global.window = {
  location: {
    origin: 'https://myslotworkout.com',
    pathname: '/',
    hash: '',
    search: ''
  },
  btoa(str) { return Buffer.from(str, 'binary').toString('base64'); },
  atob(b64) { return Buffer.from(b64, 'base64').toString('binary'); }
};

console.log('Running test suite for Slot Machine Workout...');

// Test 1: Roller 2 (Work time) constraints: 30s to 90s in 10-second intervals
assert.deepEqual(
  WORK_TIMES,
  [30, 40, 50, 60, 70, 80, 90],
  'Work times must strictly be 30s to 90s in 10s intervals'
);
console.log('✔ Test 1: Roller 2 (Work Times: 30-90s, step 10s) passed.');

// Test 2: Roller 3 (Rest time) constraints: 15s to 45s in 5-second intervals
assert.deepEqual(
  REST_TIMES,
  [15, 20, 25, 30, 35, 40, 45],
  'Rest times must strictly be 15s to 45s in 5s intervals'
);
console.log('✔ Test 2: Roller 3 (Rest Times: 15-45s, step 5s) passed.');

// Test 3: Roller 4 (Sets) constraints: 1 to 3
assert.deepEqual(
  SETS_LIST,
  [1, 2, 3],
  'Sets must strictly be [1, 2, 3]'
);
console.log('✔ Test 3: Roller 4 (Sets: 1, 2, 3) passed.');

// Test 4: Custom exercises manual input
const state = new WorkoutState();
const initialCount = state.exercises.length;
const added = state.addExercise('Kettlebell Snatch');
assert.equal(added, true, 'Should successfully add custom exercise');
assert.equal(state.exercises.includes('Kettlebell Snatch'), true);

// Prevent duplicate
const dup = state.addExercise('kettlebell snatch');
assert.equal(dup, false, 'Should reject duplicate exercise');
console.log('✔ Test 4: Manual Exercise Input & Duplicate Prevention passed.');

// Test 5: Target rolls progression and completion
state.resetSession();
state.setTargetRolls(3);
assert.equal(state.targetRolls, 3);
assert.equal(state.isCompleted, false);

// Roll 1
state.recordRoll({ exercise: 'Push-Ups', workTime: 40, restTime: 20, sets: 2 });
assert.equal(state.currentRollNumber, 1);
assert.equal(state.isCompleted, false);

// Roll 2
state.recordRoll({ exercise: 'Burpees', workTime: 50, restTime: 25, sets: 1 });
assert.equal(state.currentRollNumber, 2);
assert.equal(state.isCompleted, false);

// Roll 3 (target reached)
state.recordRoll({ exercise: 'Squats', workTime: 60, restTime: 30, sets: 3 });
assert.equal(state.currentRollNumber, 3);
assert.equal(state.isCompleted, true, 'Workout should be completed when target rolls reached');
console.log('✔ Test 5: Target Roll count & Completion detection passed.');

// Test 6: Share URL generation and parsing
import { generateShareUrl, parseSharedUrl, generateMailtoUri } from '../src/modules/share.js';

const shareUrl = generateShareUrl(state);
assert.ok(shareUrl.includes('#workout='), 'Share URL must contain #workout= fragment');

// Simulate recipient opening link
window.location.hash = shareUrl.substring(shareUrl.indexOf('#'));
const parsed = parseSharedUrl();
assert.ok(parsed, 'Parsed shared workout should not be null');
assert.equal(parsed.targetRolls, 3);
assert.ok(parsed.exercises.includes('Kettlebell Snatch'));
console.log('✔ Test 6: URL Serialization & De-serialization passed.');

// Test 7: Email mailto URI generation
const mailtoUri = generateMailtoUri({
  title: 'Morning Blast',
  exercises: ['Push-Ups', 'Burpees'],
  targetRolls: 5,
  shareUrl: shareUrl
});
assert.ok(mailtoUri.startsWith('mailto:?subject='), 'Mailto link should start with mailto:?subject=');
assert.ok(mailtoUri.includes(encodeURIComponent('Morning Blast')), 'Mailto link should contain encoded title');
assert.ok(mailtoUri.includes(encodeURIComponent('Push-Ups')), 'Mailto link body should list exercises');
console.log('✔ Test 7: Email Mailto Generator passed.');

console.log('\nAll 7 test suites passed successfully! 🚀');
