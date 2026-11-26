import { createSeedData } from '../data/seedData';

const STORAGE_KEY = 'tutortrack_v1_data';
const AUTH_KEY = 'tutortrack_v1_auth';
const PIN_KEY = 'tutortrack_v1_pin';
const DEFAULT_PIN = 'tutor123';

export function loadAppData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      saveAppData(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    return {
      lbbs: Array.isArray(parsed.lbbs) ? parsed.lbbs : [],
      students: Array.isArray(parsed.students) ? parsed.students : [],
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
    };
  } catch {
    const seed = createSeedData();
    saveAppData(seed);
    return seed;
  }
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetToSeedData() {
  const seed = createSeedData();
  saveAppData(seed);
  return seed;
}

export function getTutorPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

export function setTutorPin(newPin) {
  localStorage.setItem(PIN_KEY, newPin);
}

export function isTutorLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(AUTH_KEY) === 'true';
}

export function loginTutor(pin, remember = true) {
  if (pin !== getTutorPin()) return false;
  sessionStorage.setItem(AUTH_KEY, 'true');
  if (remember) {
    localStorage.setItem(AUTH_KEY, 'true');
  }
  return true;
}

export function logoutTutor() {
  sessionStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_KEY);
}
