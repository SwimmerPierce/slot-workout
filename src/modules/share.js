/**
 * @file share.js
 * @description Sharing and URL serialization utility for the Slot Machine Workout.
 *              Encodes exercise lists, routine titles, and target roll counts into
 *              portable shareable URL fragments and formats pre-filled email (mailto:) invites.
 * @dependencies None (Native Web APIs: window.btoa, window.atob, location, navigator.clipboard)
 * @role Handles workout link serialization, de-serialization, email payload formatting, and clipboard actions.
 */

/**
 * Safely encodes a string containing UTF-8 characters to Base64
 */
function utf8ToBase64(str) {
  return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

/**
 * Safely decodes a Base64 string containing UTF-8 characters
 */
function base64ToUtf8(str) {
  return decodeURIComponent(Array.prototype.map.call(window.atob(str), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

/**
 * Generates a full shareable URL containing the workout payload
 * @param {Object} workout - { title, exercises, targetRolls }
 * @returns {string} full shareable URL
 */
export function generateShareUrl(workout) {
  const payload = {
    t: workout.title || 'Slot Workout',
    e: workout.exercises || [],
    r: workout.targetRolls || 10,
    v: 1
  };

  const jsonStr = JSON.stringify(payload);
  const encoded = utf8ToBase64(jsonStr);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#workout=${encodeURIComponent(encoded)}`;
}

/**
 * Parses a shareable URL or hash fragment to retrieve the workout configuration
 * @returns {Object|null} parsed workout configuration or null if not present/invalid
 */
export function parseSharedUrl() {
  try {
    let hash = window.location.hash;
    if (!hash && window.location.search) {
      // Check query params as fallback
      const params = new URLSearchParams(window.location.search);
      const qWorkout = params.get('workout');
      if (qWorkout) {
        hash = `#workout=${qWorkout}`;
      }
    }

    if (!hash || !hash.includes('workout=')) {
      return null;
    }

    const rawParam = hash.split('workout=')[1]?.split('&')[0];
    if (!rawParam) return null;

    const decodedStr = base64ToUtf8(decodeURIComponent(rawParam));
    const data = JSON.parse(decodedStr);

    if (Array.isArray(data.e) && data.e.length > 0) {
      return {
        title: typeof data.t === 'string' ? data.t : 'Shared Slot Workout',
        exercises: data.e.filter(item => typeof item === 'string' && item.trim().length > 0),
        targetRolls: typeof data.r === 'number' && data.r > 0 ? Math.min(100, Math.max(1, data.r)) : 10
      };
    }
  } catch (err) {
    console.warn('Failed to parse workout from URL hash:', err);
  }
  return null;
}

/**
 * Constructs a pre-filled mailto: URI for sending the workout to someone via email
 * @param {Object} params - { title, exercises, targetRolls, shareUrl }
 * @returns {string} mailto: URL string
 */
export function generateMailtoUri({ title, exercises, targetRolls, shareUrl }) {
  const subject = `🏋️ Slot Machine Workout Challenge: ${title}`;

  const exerciseBulletList = (exercises || [])
    .map(ex => `  • ${ex}`)
    .join('\n');

  const body = `Hey!\n\nI built a custom 4-roller Slot Machine Workout and wanted to share it with you!\n\nWorkout: ${title}\nTarget Rolls to Finish: ${targetRolls} rounds\n\nExercises in this machine:\n${exerciseBulletList}\n\nClick this link to load this exact workout set directly into the slot machine and start rolling:\n${shareUrl}\n\nRules:\n• Spin the reels for each round\n• Work, Rest, and Sets are randomized from your custom machine\n• Complete all ${targetRolls} rolls to hit the jackpot!\n\nLet me know when you finish!`;

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Copies text to the user's clipboard with modern navigator API and fallback
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('Clipboard writeText failed, falling back', e);
    }
  }

  // Fallback for non-secure contexts or older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('execCommand copy failed', err);
  }
  document.body.removeChild(textArea);
  return success;
}
