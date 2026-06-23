const API_ROOT = globalThis.NEUROMENTOR_CONFIG?.apiRoot || 'http://localhost:8000/v1';
const API_BASE = `${API_ROOT}/intelligence`;
const APP_LOCALE = 'en-US';
const TREND_HISTORY_DAYS = 30;
const Core = globalThis.NeuroMentorCore;

if (!Core) {
  throw new Error('NeuroMentor shared core failed to load.');
}

const STORAGE_KEYS = {
  snapshots: 'neuroMentorDailySnapshots',
  context: 'neuroMentorContext',
  prediction: 'neuroMentorPrediction',
  snapshotDate: 'neuroMentorSnapshotDate',
  history: 'neuroMentorHistory',
  chat: 'neuroMentorChat',
  authToken: 'neuroMentorAuthToken',
  authUser: 'neuroMentorAuthUser',
  appMode: 'neuroMentorAppMode',
  deviceId: 'neuroMentorDeviceId',
  devicePlatform: 'neuroMentorDevicePlatform',
  workspaceOwner: 'neuroMentorWorkspaceOwner',
  localUserId: 'neuroMentorLocalUserId',
  phoneNumber: 'neuroMentorPhoneNumber',
  theme: 'neuroMentorTheme',
};
const WORKSPACE_STORAGE_KEYS = [
  STORAGE_KEYS.snapshots,
  STORAGE_KEYS.context,
  STORAGE_KEYS.prediction,
  STORAGE_KEYS.snapshotDate,
  STORAGE_KEYS.history,
  STORAGE_KEYS.chat,
  STORAGE_KEYS.workspaceOwner,
];
const SESSION_WORKSPACE_KEYS = new Set(WORKSPACE_STORAGE_KEYS);
const DEFAULT_REMINDER = {
  enabled: false,
  time: '20:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  deliveryConfigured: false,
  destinationEmail: '',
  lastSentAt: null,
};

const CATEGORIES = [...Core.CATEGORIES];
const CATEGORY_LABELS = Core.CATEGORY_LABELS;
const CATEGORY_COLORS = {
  social: '#ef7959',
  productivity: '#397e70',
  games: '#dca43c',
  learning: '#75963d',
  health: '#59a594',
  entertainment: '#8f7868',
};
const CATEGORY_KEYWORDS = {
  social: [
    'instagram', 'facebook', 'messenger', 'whatsapp', 'telegram', 'snapchat', 'discord', 'reddit',
    'twitter', 'threads', 'linkedin', 'messages', 'wechat', 'line', 'signal', 'locket', 'zalo',
  ],
  productivity: [
    'gmail', 'outlook', 'calendar', 'notion', 'slack', 'teams', 'zoom', 'meet', 'docs', 'sheets',
    'drive', 'trello', 'asana', 'jira', 'chrome', 'safari', 'edge', 'firefox', 'maps', 'mail',
    'files', 'notes', 'vscode', 'visual studio', 'grab', 'gojek', 'google',
  ],
  games: [
    'game', 'games', 'roblox', 'minecraft', 'candy crush', 'clash', 'pokemon', 'subway surfers',
    'brawl stars', 'genshin', 'call of duty', 'free fire', 'lien quan', 'mobile legends',
    'block blast',
  ],
  learning: [
    'duolingo', 'coursera', 'udemy', 'khan', 'quizlet', 'edx', 'skillshare', 'brilliant',
    'wikipedia', 'kindle', 'canvas', 'classroom',
  ],
  health: [
    'health', 'fitbit', 'calm', 'headspace', 'strava', 'myfitnesspal', 'fitness', 'workout',
    'meditation', 'sleep', 'nike run',
  ],
  entertainment: [
    'youtube', 'netflix', 'spotify', 'twitch', 'music', 'podcast', 'prime video', 'disney',
    'hulu', 'max', 'tv', 'video', 'tiktok', 'capcut', 'camera', 'photos', 'gallery',
  ],
};

const elements = {
  authView: document.getElementById('auth-view'),
  appShell: document.getElementById('app-shell'),
  showLogin: document.getElementById('show-login'),
  showSignup: document.getElementById('show-signup'),
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  signupEmail: document.getElementById('signup-email'),
  signupPassword: document.getElementById('signup-password'),
  signupConfirm: document.getElementById('signup-confirm'),
  loginButton: document.getElementById('login-button'),
  signupButton: document.getElementById('signup-button'),
  authStatus: document.getElementById('auth-status'),
  offlineButton: document.getElementById('offline-button'),
  engineStatus: document.getElementById('engine-status'),
  accountButton: document.getElementById('account-button'),
  accountBackdrop: document.getElementById('account-backdrop'),
  accountAvatar: document.getElementById('account-avatar'),
  accountPanel: document.getElementById('account-panel'),
  accountAvatarLarge: document.getElementById('account-avatar-large'),
  accountEmail: document.getElementById('account-email'),
  accountMemberSince: document.getElementById('account-member-since'),
  accountUserId: document.getElementById('account-user-id'),
  accountEmailMasked: document.getElementById('account-email-masked'),
  accountPhoneStatus: document.getElementById('account-phone-status'),
  accountPasswordStatus: document.getElementById('account-password-status'),
  accountPhoneRow: document.getElementById('account-phone-row'),
  accountPasswordRow: document.getElementById('account-password-row'),
  phoneEditor: document.getElementById('phone-editor'),
  phoneInput: document.getElementById('account-phone-input'),
  savePhone: document.getElementById('save-phone'),
  cancelPhone: document.getElementById('cancel-phone'),
  passwordEditor: document.getElementById('password-editor'),
  currentPassword: document.getElementById('current-password'),
  newPassword: document.getElementById('new-password'),
  confirmNewPassword: document.getElementById('confirm-new-password'),
  passwordChangeStatus: document.getElementById('password-change-status'),
  savePassword: document.getElementById('save-password'),
  cancelPassword: document.getElementById('cancel-password'),
  accountSyncTitle: document.getElementById('account-sync-title'),
  accountSyncStatus: document.getElementById('account-sync-status'),
  accountAction: document.getElementById('account-action'),
  closeAccount: document.getElementById('close-account'),
  themeToggle: document.getElementById('theme-toggle'),
  themeLabel: document.getElementById('theme-label'),
  reminderEnabled: document.getElementById('reminder-enabled'),
  reminderTime: document.getElementById('reminder-time'),
  reminderStatus: document.getElementById('reminder-status'),
  reminderSetup: document.getElementById('reminder-setup'),
  testReminder: document.getElementById('test-reminder'),
  greeting: document.getElementById('greeting'),
  focusRing: document.getElementById('focus-ring'),
  focusScore: document.getElementById('focus-score'),
  focusLabel: document.getElementById('focus-label'),
  scoreHeadline: document.getElementById('score-headline'),
  snapshotInsight: document.getElementById('snapshot-insight'),
  snapshotConfidence: document.getElementById('snapshot-confidence'),
  snapshotConfidenceBar: document.getElementById('snapshot-confidence-bar'),
  focusTrend: document.getElementById('focus-trend'),
  focusDetailScore: document.getElementById('focus-detail-score'),
  focusDetailLabel: document.getElementById('focus-detail-label'),
  focusMetric: document.getElementById('focus-metric'),
  focusExplanation: document.getElementById('focus-explanation'),
  focusContributors: document.getElementById('focus-contributors'),
  focusConfidence: document.getElementById('focus-confidence'),
  focusComparison: document.getElementById('focus-comparison'),
  fatigueScore: document.getElementById('fatigue-score'),
  fatigueLabel: document.getElementById('fatigue-label'),
  fatigueMetric: document.getElementById('fatigue-metric'),
  fatigueExplanation: document.getElementById('fatigue-explanation'),
  fatigueContributors: document.getElementById('fatigue-contributors'),
  fatigueConfidence: document.getElementById('fatigue-confidence'),
  fatigueComparison: document.getElementById('fatigue-comparison'),
  distractionScore: document.getElementById('distraction-score'),
  distractionLabel: document.getElementById('distraction-label'),
  distractionMetric: document.getElementById('distraction-metric'),
  distractionExplanation: document.getElementById('distraction-explanation'),
  distractionContributors: document.getElementById('distraction-contributors'),
  distractionConfidence: document.getElementById('distraction-confidence'),
  distractionComparison: document.getElementById('distraction-comparison'),
  burnoutRisk: document.getElementById('burnout-risk'),
  burnoutMetric: document.getElementById('burnout-metric'),
  burnoutScore: document.getElementById('burnout-score'),
  burnoutExplanation: document.getElementById('burnout-explanation'),
  burnoutContributors: document.getElementById('burnout-contributors'),
  burnoutConfidence: document.getElementById('burnout-confidence'),
  burnoutComparison: document.getElementById('burnout-comparison'),
  productiveRatio: document.getElementById('productive-ratio'),
  forecastFocus: document.getElementById('forecast-focus'),
  forecastDelta: document.getElementById('forecast-delta'),
  forecastConfidence: document.getElementById('forecast-confidence'),
  forecastReason: document.getElementById('forecast-reason'),
  forecastBurnout: document.getElementById('forecast-burnout'),
  baselineAverage: document.getElementById('baseline-average'),
  baselineToday: document.getElementById('baseline-today'),
  baselineDifference: document.getElementById('baseline-difference'),
  baselineNote: document.getElementById('baseline-note'),
  impactList: document.getElementById('impact-list'),
  dominantImpact: document.getElementById('dominant-impact'),
  learningStreak: document.getElementById('learning-streak'),
  deepWorkSessions: document.getElementById('deep-work-sessions'),
  recoveryScore: document.getElementById('recovery-score'),
  totalTime: document.getElementById('total-time'),
  usageBreakdown: document.getElementById('usage-breakdown'),
  insightList: document.getElementById('insight-list'),
  alertCard: document.getElementById('alert-card'),
  alertSeverity: document.getElementById('alert-severity'),
  alertTitle: document.getElementById('alert-title'),
  alertMessage: document.getElementById('alert-message'),
  alertReason: document.getElementById('alert-reason'),
  alertAction: document.getElementById('alert-action'),
  recommendationTitle: document.getElementById('recommendation-title'),
  recommendationText: document.getElementById('recommendation-text'),
  recommendationReason: document.getElementById('recommendation-reason'),
  recommendationReview: document.getElementById('recommendation-review'),
  analysisForm: document.getElementById('analysis-form'),
  analyzeButton: document.getElementById('analyze-button'),
  analysisStatus: document.getElementById('analysis-status'),
  screenshotInput: document.getElementById('screenshot-input'),
  importDropZone: document.getElementById('import-drop-zone'),
  screenshotReview: document.getElementById('screenshot-review'),
  screenshotPreview: document.getElementById('screenshot-preview'),
  removeScreenshot: document.getElementById('remove-screenshot'),
  applyExtraction: document.getElementById('apply-extraction'),
  ocrConfidence: document.getElementById('ocr-confidence'),
  pasteZone: document.getElementById('paste-zone'),
  ocrStatus: document.getElementById('ocr-status'),
  ocrMatches: document.getElementById('ocr-matches'),
  reportedTotal: document.getElementById('reported-total-minutes'),
  categoryTotal: document.getElementById('category-total'),
  validationSummary: document.getElementById('validation-summary'),
  trendChart: document.getElementById('trend-chart'),
  trendChartScroller: document.getElementById('trend-chart-scroller'),
  trendScrollHint: document.getElementById('trend-scroll-hint'),
  trendDirection: document.getElementById('trend-direction'),
  averageFocus: document.getElementById('average-focus'),
  averageFocusDetail: document.getElementById('average-focus-detail'),
  averageFatigue: document.getElementById('average-fatigue'),
  averageFatigueDetail: document.getElementById('average-fatigue-detail'),
  bestDay: document.getElementById('best-day'),
  trendRisk: document.getElementById('trend-risk'),
  trendNote: document.getElementById('trend-note'),
  trendEmptyState: document.getElementById('trend-empty-state'),
  trendCoverageNote: document.getElementById('trend-coverage-note'),
  trendChartLegend: document.getElementById('trend-chart-legend'),
  chatLog: document.getElementById('chat-log'),
  mentorForm: document.getElementById('mentor-form'),
  mentorQuestion: document.getElementById('mentor-question'),
  mentorContextTitle: document.getElementById('mentor-context-title'),
  mentorContextDetail: document.getElementById('mentor-context-detail'),
};

let currentSnapshot = Core.createDailySnapshot({ date: Core.localDateKey() });
let snapshots = [];
let currentContext = currentSnapshot.context;
let currentPrediction = currentSnapshot.result;
let history = [];
let workspaceDate = Core.localDateKey();
let chatHistory = [];
let previewUrl = null;
let ocrWorkerPromise = null;
let extractionState = { status: 'idle', confidence: 0, reviewed: true, items: [], error: '' };
let accountFocusReturn = null;
let authToken = null;
let currentUser = null;
let appMode = 'signed-out';
let accountDeviceId = null;
let reminderSettings = { ...DEFAULT_REMINDER };
let localUserId = null;
let phoneNumber = '';
let themePreference = 'light';

function emptyUsage() {
  return Object.fromEntries(CATEGORIES.map(category => [category, 0]));
}

function emptyContext() {
  return Core.normalizeContext({ usage: emptyUsage() });
}

function clamp(value, minimum = 0, maximum = 100) {
  return Math.round(Math.max(minimum, Math.min(maximum, value)));
}

function localDateKey(date = new Date()) {
  return Core.localDateKey(date);
}

function snapshotHistoryEntry(snapshot) {
  const normalized = Core.normalizeSnapshot(snapshot, snapshot?.date);
  return {
    date: normalized.date,
    focus_score: normalized.result.focus_score,
    fatigue_score: normalized.result.fatigue_score,
    distraction_score: normalized.result.distraction_score,
    burnout_score: normalized.result.burnout_score,
    burnout_risk: normalized.result.burnout_risk,
    productive_ratio: normalized.result.productive_ratio,
    total_minutes: normalized.result.total_minutes,
    context: normalized.context,
    snapshot: normalized,
  };
}

function refreshHistoryView() {
  snapshots = Core.uniqueSnapshots(snapshots).slice(-30);
  history = snapshots.map(snapshotHistoryEntry);
}

function reconcileCurrentSnapshot() {
  if (!currentSnapshot?.date || !currentSnapshot.validation?.valid) return;
  snapshots = Core.upsertSnapshot(snapshots, currentSnapshot).slice(-30);
  refreshHistoryView();
}

function activateSnapshot(snapshot) {
  currentSnapshot = Core.normalizeSnapshot(snapshot, workspaceDate);
  currentContext = currentSnapshot.context;
  currentPrediction = currentSnapshot.result;
  extractionState = { ...currentSnapshot.extraction };
}

async function persistSnapshots() {
  reconcileCurrentSnapshot();
  refreshHistoryView();
  await storageSet({ [STORAGE_KEYS.snapshots]: snapshots });
}

function applyExternalSnapshots(value) {
  if (!Array.isArray(value)) return;
  const incoming = Core.uniqueSnapshots(value).slice(-30);
  const sameDay = incoming.find(snapshot => snapshot.date === workspaceDate);
  snapshots = incoming;
  refreshHistoryView();

  if (sameDay && sameDay.updated_at >= (currentSnapshot?.updated_at || '')) {
    activateSnapshot(sameDay);
    populateContext(currentContext);
  }
  renderOverview(currentSnapshot);
  renderTrends();
}

function bindSnapshotStorageSync() {
  window.addEventListener('storage', event => {
    if (appMode === 'offline') return;
    if (event.key !== STORAGE_KEYS.snapshots || event.newValue === null) return;
    try {
      applyExternalSnapshots(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed data from another tab and keep the active valid snapshot.
    }
  });

  globalThis.chrome?.storage?.onChanged?.addListener((changes, areaName) => {
    if (appMode === 'offline') return;
    if (areaName !== 'local' || !changes[STORAGE_KEYS.snapshots]) return;
    applyExternalSnapshots(changes[STORAGE_KEYS.snapshots].newValue);
  });
}

function normalizeReminder(settings) {
  return {
    enabled: settings?.enabled === true,
    time: /^\d{2}:\d{2}/.test(settings?.reminder_time || settings?.time || '')
      ? (settings.reminder_time || settings.time).slice(0, 5)
      : DEFAULT_REMINDER.time,
    timezone: settings?.timezone || DEFAULT_REMINDER.timezone,
    deliveryConfigured: settings?.delivery_configured === true,
    destinationEmail: settings?.destination_email || currentUser?.email || '',
    lastSentAt: settings?.last_sent_at || null,
  };
}

function clientPlatform() {
  return window.location.protocol === 'chrome-extension:' ? 'extension' : 'web';
}

function formatReminderTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat(APP_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function setupReminderTimeOptions() {
  if (!elements.reminderTime || elements.reminderTime.options.length) return;
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
    const minute = String(minutes % 60).padStart(2, '0');
    const value = `${hour}:${minute}`;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = formatReminderTime(value);
    elements.reminderTime.appendChild(option);
  }
}

function renderReminderSettings(message = '') {
  const signedIn = appMode === 'account' && Boolean(currentUser);
  const available = signedIn && reminderSettings.deliveryConfigured;
  elements.reminderEnabled.checked = signedIn && reminderSettings.enabled;
  elements.reminderEnabled.disabled = !available;
  elements.reminderTime.value = reminderSettings.time;
  elements.reminderTime.disabled = !available;
  elements.testReminder.disabled = !available;
  elements.reminderSetup.classList.toggle('hidden', !signedIn || reminderSettings.deliveryConfigured);

  if (!signedIn) {
    elements.reminderStatus.textContent = 'Sign in to configure daily email reminders.';
  } else if (!reminderSettings.deliveryConfigured) {
    elements.reminderStatus.textContent =
      'Setup required: connect the production email provider, then restart the backend.';
  } else if (message) {
    elements.reminderStatus.textContent = message;
  } else if (reminderSettings.enabled) {
    elements.reminderStatus.textContent =
      `Email ${reminderSettings.destinationEmail} at ${formatReminderTime(reminderSettings.time)}, unless today is complete.`;
  } else {
    elements.reminderStatus.textContent = `Email reminders are off for ${reminderSettings.destinationEmail}.`;
  }
}

async function saveReminderSettings() {
  if (appMode !== 'account' || !authToken) return;
  const previous = { ...reminderSettings };
  elements.reminderEnabled.disabled = true;
  elements.reminderTime.disabled = true;
  elements.testReminder.disabled = true;
  elements.reminderStatus.textContent = 'Saving email reminder...';
  try {
    const saved = await requestAuth('/reminders/me', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: elements.reminderEnabled.checked,
        reminder_time: elements.reminderTime.value,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || reminderSettings.timezone,
      }),
    });
    reminderSettings = normalizeReminder(saved);
    renderReminderSettings('Email reminder settings saved.');
  } catch (error) {
    reminderSettings = previous;
    renderReminderSettings(error.message || 'Could not save email reminder settings.');
  }
}

async function sendTestReminder() {
  if (appMode !== 'account' || !authToken) return;
  elements.testReminder.disabled = true;
  elements.testReminder.textContent = 'Sending email...';
  elements.reminderStatus.textContent = 'Contacting the email provider...';
  try {
    const response = await requestAuth('/reminders/test', { method: 'POST' }, 25000);
    renderReminderSettings(`Test email sent to ${response.destination_email}. Check spam if needed.`);
  } catch (error) {
    renderReminderSettings(error.message || 'The test email could not be sent.');
  } finally {
    elements.testReminder.disabled = !reminderSettings.deliveryConfigured;
    elements.testReminder.textContent = 'Send test email';
  }
}

async function loadReminderSettings() {
  if (appMode !== 'account' || !authToken) {
    reminderSettings = { ...DEFAULT_REMINDER };
    renderReminderSettings();
    return;
  }
  elements.reminderStatus.textContent = 'Loading email reminder settings...';
  try {
    reminderSettings = normalizeReminder(
      await requestAuth('/reminders/me', { method: 'GET' }, 5000),
    );
    renderReminderSettings();
  } catch (error) {
    reminderSettings = {
      ...DEFAULT_REMINDER,
      destinationEmail: currentUser?.email || '',
    };
    renderReminderSettings(
      error.name === 'AbortError' || error instanceof TypeError
        ? 'Connect the backend to manage email reminders.'
        : error.message,
    );
  }
}

function formatMinutes(minutes) {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  if (safeMinutes < 60) return `${safeMinutes} min`;
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function scoreLabel(score, inverted = false) {
  const adjusted = inverted ? 100 - score : score;
  if (adjusted >= 70) return 'Strong';
  if (adjusted >= 45) return 'Moderate';
  return 'Needs attention';
}

function persistentStorageGet(keys) {
  if (globalThis.chrome?.storage?.local) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }

  const result = {};
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    result[key] = value ? JSON.parse(value) : undefined;
  });
  return Promise.resolve(result);
}

function persistentStorageSet(values) {
  if (globalThis.chrome?.storage?.local) {
    return new Promise(resolve => chrome.storage.local.set(values, resolve));
  }

  Object.entries(values).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  return Promise.resolve();
}

function persistentStorageRemove(keys) {
  if (globalThis.chrome?.storage?.local) {
    return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
  }

  keys.forEach(key => localStorage.removeItem(key));
  return Promise.resolve();
}

function sessionDataGet(keys) {
  const result = {};
  keys.forEach(key => {
    const value = sessionStorage.getItem(key);
    result[key] = value ? JSON.parse(value) : undefined;
  });
  return Promise.resolve(result);
}

function sessionDataSet(values) {
  Object.entries(values).forEach(([key, value]) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  });
  return Promise.resolve();
}

function sessionDataRemove(keys) {
  keys.forEach(key => sessionStorage.removeItem(key));
  return Promise.resolve();
}

async function storageGet(keys) {
  if (appMode !== 'offline') return persistentStorageGet(keys);
  const sessionKeys = keys.filter(key => SESSION_WORKSPACE_KEYS.has(key));
  const persistentKeys = keys.filter(key => !SESSION_WORKSPACE_KEYS.has(key));
  const [persistentValues, sessionValues] = await Promise.all([
    persistentStorageGet(persistentKeys),
    sessionDataGet(sessionKeys),
  ]);
  return { ...persistentValues, ...sessionValues };
}

async function storageSet(values) {
  const entries = Object.entries(values);
  const sessionValues = Object.fromEntries(
    entries.filter(([key]) => appMode === 'offline' && SESSION_WORKSPACE_KEYS.has(key)),
  );
  const persistentValues = Object.fromEntries(
    entries.filter(([key]) => appMode !== 'offline' || !SESSION_WORKSPACE_KEYS.has(key)),
  );
  await Promise.all([
    Object.keys(persistentValues).length ? persistentStorageSet(persistentValues) : Promise.resolve(),
    Object.keys(sessionValues).length ? sessionDataSet(sessionValues) : Promise.resolve(),
  ]);
}

async function storageRemove(keys) {
  const sessionKeys = keys.filter(key => appMode === 'offline' && SESSION_WORKSPACE_KEYS.has(key));
  const persistentKeys = keys.filter(key => appMode !== 'offline' || !SESSION_WORKSPACE_KEYS.has(key));
  await Promise.all([
    persistentKeys.length ? persistentStorageRemove(persistentKeys) : Promise.resolve(),
    sessionKeys.length ? sessionDataRemove(sessionKeys) : Promise.resolve(),
  ]);
}

function latestHistoryDate(entries) {
  return entries.reduce((latest, entry) => {
    const date = typeof entry?.date === 'string' ? entry.date : '';
    return date > latest ? date : latest;
  }, '');
}

function showNewDayStatus() {
  elements.analysisStatus.textContent =
    'A new day started. Yesterday is still available in Trends; add today\'s Screen Time.';
  elements.analysisStatus.className = 'form-status';
}

async function startFreshWorkspaceDay(showStatus = true) {
  activateSnapshot(Core.createDailySnapshot({ date: workspaceDate }));
  populateContext(currentContext);
  renderOverview(currentSnapshot);

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  elements.screenshotPreview.removeAttribute('src');
  elements.screenshotReview?.classList.add('hidden');
  elements.ocrConfidence?.classList.add('hidden');
  elements.applyExtraction?.classList.add('hidden');
  elements.ocrMatches.innerHTML = '';
  elements.ocrMatches.classList.add('hidden');
  setOcrStatus('Upload or paste today\'s Screen Time screenshot.');

  await storageRemove([
    STORAGE_KEYS.context,
    STORAGE_KEYS.prediction,
    STORAGE_KEYS.snapshotDate,
  ]);
  if (showStatus) showNewDayStatus();
}

async function rolloverWorkspaceDay() {
  const today = localDateKey();
  if (workspaceDate === today) return;
  workspaceDate = today;
  await startFreshWorkspaceDay();
}

function switchScreen(screenName) {
  document.querySelectorAll('[data-screen]').forEach(screen => {
    screen.classList.toggle('active', screen.dataset.screen === screenName);
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.toggle('active', button.dataset.screenTarget === screenName);
  });
  document.body.scrollTop = 0;

  if (screenName === 'trends') renderTrends();
  if (screenName === 'mentor') elements.mentorQuestion.focus();
}

function requestedScreen() {
  const screen = new URLSearchParams(window.location.search).get('screen');
  return ['overview', 'analyze', 'trends', 'mentor'].includes(screen) ? screen : null;
}

function setEngineStatus(source) {
  const states = {
    cloud: ['API', 'Analysis API connected'],
    checking: ['Checking', 'Checking analysis API'],
    offline: ['Offline', 'Offline; using the local model'],
    unconfigured: ['Local', 'API unavailable or not configured; using the local model'],
    error: ['Error', 'Analysis service error'],
    local: ['Local', 'Using the local analysis model'],
    'local-model': ['Local', 'Using the local analysis model'],
  };
  const [text, title] = states[source] || states.local;
  const cloud = source === 'cloud';
  elements.engineStatus?.classList.toggle('cloud', cloud);
  elements.engineStatus?.setAttribute('data-state', source || 'local');
  elements.engineStatus?.setAttribute('title', title);
  const label = elements.engineStatus?.querySelector('span:last-child');
  if (label) label.textContent = text;
}

function setGreeting() {
  const hour = new Date().getHours();
  const phrase = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const identity = currentUser?.email?.split('@')[0];
  elements.greeting.textContent = identity ? `${phrase}, ${identity}` : phrase;
}

function collectContext() {
  const usage = emptyUsage();
  CATEGORIES.forEach(category => {
    usage[category] = Math.max(0, Number(document.getElementById(category).value) || 0);
  });

  return Core.normalizeContext({
    usage,
    app_switches: Math.max(0, Number(document.getElementById('app-switches').value) || 0),
    late_night_minutes: Math.max(0, Number(document.getElementById('late-night-minutes').value) || 0),
    deep_work_minutes: Math.max(0, Number(document.getElementById('deep-work-minutes').value) || 0),
    launch_count: Math.max(0, Number(document.getElementById('launch-count').value) || 0),
    reported_total_minutes: elements.reportedTotal?.value ?? null,
  });
}

function populateContext(context) {
  const safeContext = context || emptyContext();
  CATEGORIES.forEach(category => {
    document.getElementById(category).value = safeContext.usage?.[category] || 0;
  });
  document.getElementById('app-switches').value = safeContext.app_switches || 0;
  document.getElementById('late-night-minutes').value = safeContext.late_night_minutes || 0;
  document.getElementById('deep-work-minutes').value = safeContext.deep_work_minutes || 0;
  document.getElementById('launch-count').value = safeContext.launch_count || safeContext.app_launches || 0;
  if (elements.reportedTotal) {
    elements.reportedTotal.value = safeContext.reported_total_minutes ?? '';
  }
  renderValidation(Core.validateContext(safeContext), false);
}

function renderValidation(validation = Core.validateContext(collectContext()), announce = true) {
  if (elements.categoryTotal) {
    elements.categoryTotal.textContent = formatMinutes(validation.category_total_minutes);
  }
  if (!elements.validationSummary) return validation;

  if (!announce && validation.category_total_minutes === 0) {
    elements.validationSummary.innerHTML = '';
    elements.validationSummary.className = 'validation-summary';
    return validation;
  }

  const messages = [...validation.errors, ...validation.warnings];
  elements.validationSummary.innerHTML = messages
    .map(message => `<p>${escapeHtml(message)}</p>`)
    .join('');
  elements.validationSummary.className = `validation-summary ${
    validation.errors.length ? 'error' : validation.warnings.length ? 'warning' : 'valid'
  }`;
  if (announce && validation.valid && validation.category_total_minutes > 0) {
    elements.validationSummary.innerHTML = '<p>Category totals are consistent and ready to save.</p>';
  }
  return validation;
}

function predictLocally(context) {
  return Core.calculatePrediction(context);
}

async function fetchWithTimeout(url, options, timeoutMs = 1800) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function apiHeaders(includeJson = true) {
  const headers = {};
  if (includeJson) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

function setAuthStatus(message = '', tone = '') {
  elements.authStatus.textContent = message;
  elements.authStatus.className = `auth-status ${tone}`.trim();
}

function setAuthMode(mode) {
  const login = mode === 'login';
  elements.loginForm.classList.toggle('hidden', !login);
  elements.signupForm.classList.toggle('hidden', login);
  elements.showLogin.classList.toggle('active', login);
  elements.showSignup.classList.toggle('active', !login);
  elements.showLogin.setAttribute('aria-selected', String(login));
  elements.showSignup.setAttribute('aria-selected', String(!login));
  setAuthStatus();
  (login ? elements.loginEmail : elements.signupEmail).focus();
}

function setAuthLoading(loading, mode) {
  elements.loginButton.disabled = loading;
  elements.signupButton.disabled = loading;
  elements.offlineButton.disabled = loading;
  if (mode === 'login') {
    elements.loginButton.textContent = loading ? 'Checking your account...' : 'Enter NeuroMentor';
  }
  if (mode === 'signup') {
    elements.signupButton.textContent = loading ? 'Creating your workspace...' : 'Create my account';
  }
}

async function readApiError(response) {
  try {
    const body = await response.json();
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.detail)) return body.detail[0]?.msg || 'Please check the form and try again.';
  } catch {
    // Use the status-based fallback below.
  }
  return response.status >= 500
    ? 'The NeuroMentor server is unavailable right now.'
    : 'The request could not be completed.';
}

async function requestAuth(path, options = {}, timeoutMs = 6000) {
  const response = await fetchWithTimeout(`${API_ROOT}${path}`, {
    ...options,
    headers: { ...apiHeaders(options.body !== undefined), ...(options.headers || {}) },
  }, timeoutMs);

  if (!response.ok) {
    const error = new Error(await readApiError(response));
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

function userInitial(user = currentUser) {
  return user?.email?.trim()?.charAt(0)?.toUpperCase() || 'O';
}

function shortStableId(seed) {
  const source = String(seed || 'offline-workspace');
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

function createLocalUserId() {
  const randomSeed = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `NM-${shortStableId(randomSeed)}`;
}

function displayUserId() {
  if (appMode === 'account' && currentUser) {
    return `NM-${shortStableId(currentUser.id || currentUser.email)}`;
  }
  return localUserId || 'NM-LOCAL';
}

function maskEmail(email) {
  const [name = '', domain = ''] = String(email || '').split('@');
  if (!name || !domain) return 'Not signed in';
  const visible = name.length <= 4 ? name.slice(0, 1) : name.slice(0, Math.min(10, name.length - 2));
  return `${visible}****@${domain}`;
}

function maskPhone(number) {
  const cleaned = String(number || '').replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return 'Not set';
  if (digits.length <= 4) return cleaned;
  return `${cleaned.slice(0, Math.min(3, cleaned.length - 4))}****${digits.slice(-4)}`;
}

function setPasswordStatus(message = '', type = '') {
  if (!elements.passwordChangeStatus) return;
  elements.passwordChangeStatus.textContent = message;
  elements.passwordChangeStatus.classList.toggle('error', type === 'error');
  elements.passwordChangeStatus.classList.toggle('success', type === 'success');
}

function closeSettingsEditor(editorName) {
  if (!editorName || editorName === 'phone') {
    elements.phoneEditor?.classList.add('hidden');
    elements.accountPhoneRow?.setAttribute('aria-expanded', 'false');
  }
  if (!editorName || editorName === 'password') {
    elements.passwordEditor?.classList.add('hidden');
    elements.accountPasswordRow?.setAttribute('aria-expanded', 'false');
    setPasswordStatus('');
  }
}

function openPhoneEditor() {
  closeSettingsEditor('password');
  if (elements.phoneInput) elements.phoneInput.value = phoneNumber;
  elements.phoneEditor?.classList.toggle('hidden');
  const isOpen = !elements.phoneEditor?.classList.contains('hidden');
  elements.accountPhoneRow?.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) elements.phoneInput?.focus();
}

function openPasswordEditor() {
  if (appMode !== 'account' || !authToken) {
    showAuthView('Log in first to change your password.');
    return;
  }
  closeSettingsEditor('phone');
  elements.passwordEditor?.classList.toggle('hidden');
  const isOpen = !elements.passwordEditor?.classList.contains('hidden');
  elements.accountPasswordRow?.setAttribute('aria-expanded', String(isOpen));
  setPasswordStatus(isOpen ? 'Use at least 8 characters for the new password.' : '');
  if (isOpen) {
    elements.currentPassword.value = '';
    elements.newPassword.value = '';
    elements.confirmNewPassword.value = '';
    elements.currentPassword?.focus();
  }
}

function applyTheme(theme, persist = false) {
  themePreference = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = themePreference;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', themePreference === 'dark' ? '#101513' : '#f4f0e7');
  if (elements.themeToggle) elements.themeToggle.checked = themePreference === 'dark';
  if (elements.themeLabel) elements.themeLabel.textContent = themePreference === 'dark' ? 'Dark' : 'Light';
  if (persist) void storageSet({ [STORAGE_KEYS.theme]: themePreference });
}

function tokenSubject(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(atob(padded)).sub || null;
  } catch {
    return null;
  }
}

function renderAccount() {
  const signedIn = appMode === 'account' && currentUser;
  const initial = signedIn ? userInitial() : 'O';
  elements.accountAvatar.textContent = initial;
  elements.accountAvatarLarge.textContent = initial;
  if (elements.accountUserId) elements.accountUserId.textContent = displayUserId();
  if (elements.accountEmailMasked) {
    elements.accountEmailMasked.textContent = signedIn ? maskEmail(currentUser.email) : 'Not signed in';
  }
  if (elements.accountPhoneStatus) elements.accountPhoneStatus.textContent = maskPhone(phoneNumber);
  if (elements.accountPasswordStatus) {
    elements.accountPasswordStatus.textContent = signedIn ? 'Change password' : 'Sign in first';
  }
  applyTheme(themePreference);

  if (signedIn) {
    const createdAt = currentUser.created_at ? new Date(currentUser.created_at) : null;
    const memberSince = createdAt && !Number.isNaN(createdAt.getTime())
      ? `Member since ${createdAt.toLocaleDateString(APP_LOCALE, { month: 'short', year: 'numeric' })}`
      : 'NeuroMentor account';
    elements.accountEmail.textContent = currentUser.email;
    elements.accountMemberSince.textContent = memberSince;
    elements.accountSyncTitle.textContent = 'Account connected';
    elements.accountSyncStatus.textContent = 'New analyses sync to your private account.';
    elements.accountAction.textContent = 'Log out';
    elements.accountAction.dataset.action = 'logout';
  } else {
    elements.accountEmail.textContent = 'Offline workspace';
    elements.accountMemberSince.textContent = 'Temporary session';
    elements.accountSyncTitle.textContent = 'Temporary offline session';
    elements.accountSyncStatus.textContent = 'Your analysis resets when this tab is closed.';
    elements.accountAction.textContent = 'Log in or create account';
    elements.accountAction.dataset.action = 'login';
  }
}

function openAccountPanel() {
  renderAccount();
  accountFocusReturn = document.activeElement;
  elements.accountPanel.classList.remove('hidden');
  elements.accountBackdrop?.classList.remove('hidden');
  elements.accountButton?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('settings-open');
  elements.accountPanel.focus();
}

function closeAccountPanel() {
  elements.accountPanel.classList.add('hidden');
  elements.accountBackdrop?.classList.add('hidden');
  elements.accountButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('settings-open');
  closeSettingsEditor();
  accountFocusReturn?.focus?.();
  accountFocusReturn = null;
}

function handleAccountPanelKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeAccountPanel();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...elements.accountPanel.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter(element => !element.closest('.hidden'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && [first, elements.accountPanel].includes(document.activeElement)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === elements.accountPanel) {
    event.preventDefault();
    first.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

async function savePhoneNumber() {
  phoneNumber = (elements.phoneInput?.value || '').trim();
  await storageSet({ [STORAGE_KEYS.phoneNumber]: phoneNumber });
  renderAccount();
  closeSettingsEditor('phone');
}

async function savePasswordChange() {
  if (appMode !== 'account' || !authToken) {
    setPasswordStatus('Log in first to change your password.', 'error');
    return;
  }

  const currentPassword = elements.currentPassword?.value || '';
  const newPassword = elements.newPassword?.value || '';
  const confirmPassword = elements.confirmNewPassword?.value || '';

  if (!currentPassword) {
    setPasswordStatus('Enter your current password.', 'error');
    return;
  }
  if (newPassword.length < 8) {
    setPasswordStatus('New password must be at least 8 characters.', 'error');
    return;
  }
  if (newPassword !== confirmPassword) {
    setPasswordStatus('The new passwords do not match.', 'error');
    return;
  }

  elements.savePassword.disabled = true;
  elements.savePassword.textContent = 'Updating...';
  setPasswordStatus('Updating your password...', '');
  try {
    await requestAuth('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    elements.currentPassword.value = '';
    elements.newPassword.value = '';
    elements.confirmNewPassword.value = '';
    setPasswordStatus('Password updated.', 'success');
    setTimeout(() => closeSettingsEditor('password'), 900);
  } catch (error) {
    setPasswordStatus(error.message || 'Could not update password.', 'error');
  } finally {
    elements.savePassword.disabled = false;
    elements.savePassword.textContent = 'Update password';
  }
}

function showAuthView(message = '') {
  appMode = 'signed-out';
  elements.accountPanel.classList.add('hidden');
  elements.appShell.classList.add('hidden');
  elements.authView.classList.remove('hidden');
  setAuthMode('login');
  if (message) setAuthStatus(message, 'error');
}

function showWorkspace() {
  elements.authView.classList.add('hidden');
  elements.appShell.classList.remove('hidden');
  setGreeting();
  renderAccount();
  const screen = requestedScreen();
  if (screen) switchScreen(screen);
}

async function resetWorkspaceData() {
  snapshots = [];
  history = [];
  chatHistory = [];
  workspaceDate = localDateKey();
  activateSnapshot(Core.createDailySnapshot({ date: workspaceDate }));
  populateContext(currentContext);
  renderOverview(currentSnapshot);
  renderTrends();
  elements.chatLog.querySelectorAll('.chat-message:not(:first-child)').forEach(message => message.remove());
  await storageRemove([
    STORAGE_KEYS.context,
    STORAGE_KEYS.prediction,
    STORAGE_KEYS.snapshots,
    STORAGE_KEYS.snapshotDate,
    STORAGE_KEYS.history,
    STORAGE_KEYS.chat,
  ]);
}

async function claimWorkspace(owner) {
  const stored = await storageGet([STORAGE_KEYS.workspaceOwner]);
  const previousOwner = stored[STORAGE_KEYS.workspaceOwner];
  if (previousOwner && previousOwner !== owner) {
    await resetWorkspaceData();
  }
  await storageSet({ [STORAGE_KEYS.workspaceOwner]: owner });
}

async function startAccountSession(token, user) {
  const previousMode = appMode;
  authToken = token;
  currentUser = user;
  appMode = 'account';
  await claimWorkspace(user.id);
  await storageSet({
    [STORAGE_KEYS.authToken]: token,
    [STORAGE_KEYS.authUser]: user,
    [STORAGE_KEYS.appMode]: 'account',
  });
  if (previousMode === 'offline') {
    const accountWorkspace = await persistentStorageGet(WORKSPACE_STORAGE_KEYS);
    await restoreWorkspaceState(accountWorkspace);
  }
  showWorkspace();
  setEngineStatus('cloud');
  await loadReminderSettings();
}

async function handleAuthentication(mode) {
  const signingUp = mode === 'signup';
  const email = (signingUp ? elements.signupEmail.value : elements.loginEmail.value).trim();
  const password = signingUp ? elements.signupPassword.value : elements.loginPassword.value;

  if (signingUp && password !== elements.signupConfirm.value) {
    setAuthStatus('The passwords do not match.', 'error');
    elements.signupConfirm.focus();
    return;
  }

  setAuthLoading(true, mode);
  setAuthStatus(signingUp ? 'Creating your private workspace...' : 'Restoring your workspace...');

  try {
    const payload = signingUp
      ? { email, password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }
      : { email, password };
    const tokenResponse = await requestAuth(`/auth/${signingUp ? 'register' : 'login'}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    authToken = tokenResponse.access_token;
    let user;
    try {
      user = await requestAuth('/auth/me', { method: 'GET' });
    } catch (error) {
      if (error.status) throw error;
      user = {
        id: tokenSubject(tokenResponse.access_token) || `pending:${email.toLowerCase()}`,
        email: email.toLowerCase(),
        created_at: new Date().toISOString(),
      };
    }
    await startAccountSession(tokenResponse.access_token, user);
    setAuthStatus();
    elements.loginForm.reset();
    elements.signupForm.reset();
  } catch (error) {
    const message = error.name === 'AbortError' || error instanceof TypeError
      ? 'Cannot reach the account server. Start the backend or continue offline.'
      : error.message;
    setAuthStatus(message, 'error');
  } finally {
    setAuthLoading(false, mode);
  }
}

async function continueOffline() {
  authToken = null;
  currentUser = null;
  accountDeviceId = null;
  appMode = 'offline';
  await sessionDataRemove(WORKSPACE_STORAGE_KEYS);
  await resetWorkspaceData();
  await storageSet({ [STORAGE_KEYS.appMode]: 'offline' });
  await storageSet({ [STORAGE_KEYS.workspaceOwner]: 'offline' });
  await storageRemove([
    STORAGE_KEYS.authToken,
    STORAGE_KEYS.authUser,
    STORAGE_KEYS.deviceId,
    STORAGE_KEYS.devicePlatform,
  ]);
  showWorkspace();
  setEngineStatus('local');
  renderReminderSettings();
}

async function logout() {
  authToken = null;
  currentUser = null;
  accountDeviceId = null;
  await storageRemove([
    STORAGE_KEYS.authToken,
    STORAGE_KEYS.authUser,
    STORAGE_KEYS.appMode,
    STORAGE_KEYS.deviceId,
    STORAGE_KEYS.devicePlatform,
  ]);
  reminderSettings = { ...DEFAULT_REMINDER };
  showAuthView('You have been logged out.');
}

async function restoreAccountSession(token, cachedUser) {
  authToken = token;
  currentUser = cachedUser || null;

  try {
    const user = await requestAuth('/auth/me', { method: 'GET' }, 4500);
    await startAccountSession(token, user);
    return true;
  } catch (error) {
    if (error.status === 401) {
      await storageRemove([
        STORAGE_KEYS.authToken,
        STORAGE_KEYS.authUser,
        STORAGE_KEYS.deviceId,
        STORAGE_KEYS.devicePlatform,
      ]);
      authToken = null;
      currentUser = null;
      return false;
    }

    if (cachedUser) {
      appMode = 'account';
      showWorkspace();
      elements.accountSyncTitle.textContent = 'Working locally';
      elements.accountSyncStatus.textContent = 'Your account will reconnect when the backend is available.';
      setEngineStatus('local');
      renderReminderSettings('Connect the backend to manage email reminders.');
      return true;
    }
    return false;
  }
}

async function ensureAccountDevice() {
  if (!authToken) return null;
  if (accountDeviceId) return accountDeviceId;

  const platform = clientPlatform();
  const devices = await requestAuth('/devices', { method: 'GET' }, 3500);
  const existing = devices.find(device => device.platform === platform);
  if (existing) {
    accountDeviceId = existing.id;
  } else {
    const created = await requestAuth('/devices', {
      method: 'POST',
      body: JSON.stringify({
        platform,
        device_name: platform === 'web' ? 'NeuroMentor Web' : 'NeuroMentor Chrome Extension',
      }),
    }, 3500);
    accountDeviceId = created.id;
  }
  await storageSet({
    [STORAGE_KEYS.deviceId]: accountDeviceId,
    [STORAGE_KEYS.devicePlatform]: platform,
  });
  return accountDeviceId;
}

async function syncUsageToAccount(usage) {
  if (appMode !== 'account' || !authToken) return false;

  try {
    elements.accountSyncTitle.textContent = 'Syncing today';
    elements.accountSyncStatus.textContent = 'Saving your latest usage totals...';
    const deviceId = await ensureAccountDevice();
    await requestAuth('/usage/sessions', {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        session_date: localDateKey(),
        source: clientPlatform() === 'web' ? 'manual' : 'extension',
        usage,
      }),
    }, 5000);
    elements.accountSyncTitle.textContent = 'Synced';
    elements.accountSyncStatus.textContent = `Latest analysis saved ${new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}.`;
    return true;
  } catch {
    elements.accountSyncTitle.textContent = 'Saved locally';
    elements.accountSyncStatus.textContent = 'Cloud sync will be available when the backend reconnects.';
    return false;
  }
}

async function requestPrediction(context) {
  setEngineStatus('checking');
  try {
    const response = await fetchWithTimeout(`${API_BASE}/predict`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(context),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const prediction = await response.json();
    prediction.source = 'cloud';
    return Core.canonicalizePrediction(prediction, context);
  } catch (error) {
    const prediction = Core.calculatePrediction(context);
    prediction.source = navigator.onLine ? 'unconfigured' : 'offline';
    return prediction;
  }
}

function renderBreakdown(usage) {
  const total = Object.values(usage).reduce((sum, value) => sum + value, 0);
  const ordered = [...CATEGORIES].sort((a, b) => usage[b] - usage[a]);

  elements.usageBreakdown.innerHTML = ordered.map(category => {
    const percentage = total ? Math.round((usage[category] / total) * 100) : 0;
    return `
      <div class="breakdown-row">
        <span class="breakdown-label">${CATEGORY_LABELS[category]}</span>
        <div class="breakdown-track">
          <div
            class="breakdown-bar"
            style="--bar: ${percentage}%; --bar-color: ${CATEGORY_COLORS[category]}"
          ></div>
        </div>
        <span class="breakdown-time">${formatMinutes(usage[category])}</span>
      </div>
    `;
  }).join('');
}

function applyMetricBand(element, band, score, hasData) {
  if (!element) return;
  element.dataset.signal = hasData ? band.tone : 'neutral';
  element.style.setProperty('--metric-score', hasData ? score : 0);
}

function renderContributorList(element, contributors) {
  element.innerHTML = contributors
    .slice(0, 4)
    .map(contributor => `<li>${escapeHtml(contributor)}</li>`)
    .join('');
}

function dominantUsage(result) {
  const category = result.top_category && CATEGORIES.includes(result.top_category)
    ? result.top_category
    : CATEGORIES.reduce((best, item) => result.usage[item] > result.usage[best] ? item : best);
  const minutes = Number(result.usage?.[category]) || 0;
  const percentage = result.total_minutes
    ? Math.round((minutes / result.total_minutes) * 100)
    : 0;
  return { category, minutes, percentage };
}

function buildSnapshotInsight(result, context) {
  const dominant = dominantUsage(result);
  const categoryName = CATEGORY_LABELS[dominant.category] || 'Your largest category';
  const deepWork = Number(context.deep_work_minutes) || 0;
  const firstSentence = dominant.percentage
    ? `${categoryName} represented ${dominant.percentage}% of your screen time.`
    : 'Your screen-time mix is still being established.';
  const secondSentence = deepWork >= 25
    ? `You also protected ${deepWork} minutes for deeper work.`
    : 'No sustained deep-work session was detected.';
  return `${firstSentence} ${secondSentence}`;
}

function previousFocusEntries() {
  const today = localDateKey();
  return history.filter(entry => (
    entry.date !== today && Number.isFinite(Number(entry.focus_score))
  ));
}

function renderBaseline(result, hasData) {
  if (!hasData) {
    elements.baselineAverage.textContent = '--';
    elements.baselineToday.textContent = '--';
    elements.baselineDifference.textContent = '--';
    elements.baselineDifference.className = '';
    elements.baselineNote.textContent =
      'More daily snapshots will create your personal baseline.';
    elements.focusTrend.textContent = 'Your baseline starts here.';
    return;
  }

  const previous = previousFocusEntries();
  const average = previous.length
    ? Math.round(previous.reduce((sum, entry) => sum + Number(entry.focus_score), 0) / previous.length)
    : result.focus_score;
  const difference = result.focus_score - average;
  const differenceText = difference > 0 ? `+${difference}` : String(difference);

  elements.baselineAverage.textContent = average;
  elements.baselineToday.textContent = result.focus_score;
  elements.baselineDifference.textContent = previous.length ? differenceText : 'New';
  elements.baselineDifference.className = difference > 0
    ? 'positive'
    : difference < 0
      ? 'negative'
      : 'neutral';
  elements.baselineNote.textContent = previous.length
    ? difference > 4
      ? 'Today is above your recent personal average. Protect what worked.'
      : difference < -4
        ? 'Today is below your recent average, which makes the next small action easier to target.'
        : 'Today is close to your recent baseline. Consistency is becoming visible.'
    : 'This is your first baseline. Future scores will compare against your own history.';
  elements.focusTrend.textContent = previous.length
    ? `${differenceText} vs your personal average`
    : 'First personal baseline recorded';
}

function renderForecast(result, context, hasData) {
  if (!hasData) {
    elements.forecastFocus.textContent = '--';
    elements.forecastDelta.textContent = 'No forecast';
    elements.forecastDelta.className = 'forecast-delta neutral';
    elements.forecastConfidence.textContent = '0% confidence';
    elements.forecastReason.textContent =
      'Add today\'s snapshot to generate a cautious next-day estimate.';
    elements.forecastBurnout.textContent = 'Not available';
    return;
  }

  let opportunity = 2;
  let reason = 'Keeping today\'s balance should support a similar attention pattern tomorrow.';
  if (context.deep_work_minutes < 25) {
    opportunity += 5;
    reason = 'A protected 30-minute focus block would address today\'s strongest missing signal.';
  }
  if (result.productive_ratio < 0.35) opportunity += 3;
  if (context.late_night_minutes >= 60) {
    opportunity -= 3;
    reason = 'Reducing late-night screen use would give tomorrow\'s focus estimate more support.';
  }

  const predicted = clamp(result.focus_score + opportunity);
  const delta = predicted - result.focus_score;
  const confidence = clamp(
    Math.round(result.confidence) - 20 + Math.min(history.length * 3, 12),
    45,
    82,
  );
  elements.forecastFocus.textContent = predicted;
  elements.forecastDelta.textContent = `${delta >= 0 ? '+' : ''}${delta} potential`;
  elements.forecastDelta.className = `forecast-delta ${delta > 0 ? 'positive' : 'neutral'}`;
  elements.forecastConfidence.textContent = `${confidence}% confidence`;
  elements.forecastReason.textContent = reason;
  elements.forecastBurnout.textContent = result.burnout_risk === 'high'
    ? 'Elevated; prioritize recovery'
    : ['moderate', 'elevated'].includes(result.burnout_risk)
      ? 'Moderate; likely to ease with recovery'
      : 'Low and stable';
}

function buildBehaviorImpacts(result, context) {
  const dominant = dominantUsage(result);
  const impacts = [];
  const categoryName = CATEGORY_LABELS[dominant.category] || 'Dominant usage';
  const stimulationCategory = ['games', 'entertainment', 'social'].includes(dominant.category);

  if (dominant.percentage) {
    impacts.push({
      label: `${categoryName} concentration`,
      value: stimulationCategory
        ? `+${clamp(dominant.percentage * 0.31, 4, 24)} distraction`
        : `+${clamp(dominant.percentage * 0.2, 3, 16)} focus`,
      impact: stimulationCategory ? dominant.percentage : -dominant.percentage,
      tone: stimulationCategory ? 'pressure' : 'support',
    });
  }
  if (context.deep_work_minutes < 25) {
    impacts.push({
      label: 'No sustained deep-work block',
      value: '+15 distraction',
      impact: 15,
      tone: 'pressure',
    });
  } else {
    impacts.push({
      label: `${context.deep_work_minutes} min deep work`,
      value: `+${clamp(context.deep_work_minutes / 5, 5, 18)} focus`,
      impact: -context.deep_work_minutes,
      tone: 'support',
    });
  }
  if (result.productive_ratio < 0.35) {
    impacts.push({
      label: 'Low productivity ratio',
      value: '+10 distraction',
      impact: 10,
      tone: 'pressure',
    });
  }
  if (context.late_night_minutes > 0) {
    impacts.push({
      label: `${context.late_night_minutes} min late-night use`,
      value: `+${clamp(context.late_night_minutes / 8, 3, 18)} fatigue`,
      impact: context.late_night_minutes / 8,
      tone: 'pressure',
    });
  }
  if (result.switch_rate >= 8) {
    impacts.push({
      label: `${Number(result.switch_rate).toFixed(1)} switches per hour`,
      value: `+${clamp(result.switch_rate * 0.7, 3, 16)} distraction`,
      impact: result.switch_rate,
      tone: 'pressure',
    });
  }
  return impacts.sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact));
}

function renderBehaviorImpacts(result, context, hasData) {
  if (!hasData) {
    elements.impactList.innerHTML = `
      <div class="impact-empty">Complete an analysis to reveal the strongest behavioral influences.</div>
    `;
    elements.dominantImpact.textContent = 'Waiting for today\'s data';
    return;
  }

  const impacts = buildBehaviorImpacts(result, context);
  elements.impactList.innerHTML = impacts.slice(0, 4).map(item => `
    <div class="impact-row ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
    </div>
  `).join('');
  elements.dominantImpact.textContent = impacts[0]?.label || 'Balanced usage';
}

function calculateLearningStreak() {
  const entries = [...history].sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return 0;
  let expected = new Date(`${entries[0].date}T12:00:00`);
  let streak = 0;

  for (const entry of entries) {
    if (entry.date !== localDateKey(expected)) break;
    if ((Number(entry.context?.usage?.learning) || 0) <= 0) break;
    streak += 1;
    expected.setDate(expected.getDate() - 1);
  }
  return streak;
}

function renderAchievements(result, hasData) {
  const monthKey = localDateKey().slice(0, 7);
  const deepWorkSessions = history
    .filter(entry => entry.date.startsWith(monthKey))
    .reduce((sum, entry) => (
      sum + Math.floor((Number(entry.context?.deep_work_minutes) || 0) / 25)
    ), 0);
  const recovery = hasData
    ? clamp(
      100
      - result.fatigue_score * 0.55
      - result.burnout_score * 0.3
      + result.recovery_ratio * 25,
    )
    : null;

  const streak = calculateLearningStreak();
  elements.learningStreak.textContent = `${streak} ${streak === 1 ? 'day' : 'days'}`;
  elements.deepWorkSessions.textContent = `${deepWorkSessions} this month`;
  elements.recoveryScore.textContent = recovery === null ? '--' : `${recovery}%`;
}

function metricContributors(result, context) {
  const dominant = dominantUsage(result);
  const dominantLabel = `${CATEGORY_LABELS[dominant.category]}: ${dominant.percentage}% of screen time`;
  return {
    focus: [
      dominantLabel,
      `${formatMinutes(result.total_minutes)} total screen load`,
      context.deep_work_minutes >= 25
        ? `${context.deep_work_minutes} minutes of protected deep work`
        : 'No sustained deep-work block',
      `${Math.round(result.productive_ratio * 100)}% productive or learning activity`,
    ],
    fatigue: [
      `${formatMinutes(result.total_minutes)} total screen load`,
      context.late_night_minutes
        ? `${context.late_night_minutes} late-night minutes`
        : 'No late-night use reported',
      result.recovery_ratio >= 0.08 ? 'Recovery activity detected' : 'Limited recovery activity',
    ],
    distraction: [
      dominantLabel,
      result.switch_rate
        ? `${Number(result.switch_rate).toFixed(1)} app switches per screen-time hour`
        : 'No app-switching estimate supplied',
      context.launch_count ? `${context.launch_count} app launches` : 'No launch count supplied',
    ],
    burnout: [
      `Mental fatigue signal: ${result.fatigue_score}/100`,
      context.late_night_minutes
        ? `${context.late_night_minutes} late-night minutes`
        : 'No late-night pressure reported',
      result.recovery_ratio >= 0.08 ? 'Some recovery activity detected' : 'Low recovery share',
    ],
  };
}

function comparisonText(metric) {
  const comparison = Core.metricComparison(metric, currentSnapshot, snapshots);
  if (comparison.previous === null) return 'Previous: not available yet.';
  const sign = comparison.change > 0 ? '+' : '';
  return `Previous: ${comparison.previous}/100. Change: ${sign}${comparison.change}.`;
}

function renderOverview(snapshotOrPrediction) {
  const snapshot = snapshotOrPrediction?.result
    ? Core.normalizeSnapshot(snapshotOrPrediction, snapshotOrPrediction.date)
    : Core.createDailySnapshot({
        date: workspaceDate,
        context: snapshotOrPrediction ? currentContext : emptyContext(),
        prediction: snapshotOrPrediction,
      });
  const result = snapshot.result;
  const hasData = result.total_minutes > 0;
  const context = hasData ? snapshot.context : emptyContext();
  const confidence = hasData ? Math.round(result.confidence) : 0;
  const contributors = metricContributors(result, context);
  const focusBand = Core.scoreBand('focus', result.focus_score);
  const fatigueBand = Core.scoreBand('fatigue', result.fatigue_score);
  const distractionBand = Core.scoreBand('distraction', result.distraction_score);
  const burnoutBand = Core.scoreBand('burnout', result.burnout_score);
  const focusLabel = hasData ? focusBand.label : 'No baseline';

  applyMetricBand(elements.focusMetric, focusBand, result.focus_score, hasData);
  applyMetricBand(elements.fatigueMetric, fatigueBand, result.fatigue_score, hasData);
  applyMetricBand(elements.distractionMetric, distractionBand, result.distraction_score, hasData);
  applyMetricBand(elements.burnoutMetric, burnoutBand, result.burnout_score, hasData);

  elements.focusRing.style.setProperty('--score', result.focus_score);
  elements.focusScore.textContent = result.focus_score;
  elements.focusLabel.className = `state-chip ${hasData ? focusBand.tone : 'neutral'}`;
  elements.focusLabel.textContent = focusLabel;
  elements.scoreHeadline.textContent = hasData
    ? ['strong', 'steady'].includes(focusBand.key)
      ? 'Your attention has a strong foundation today.'
      : focusBand.key === 'building'
        ? 'Your focus has useful momentum and a few clear pressure points.'
        : 'Your focus needs support, not judgment.'
    : 'Add today\'s usage to build your cognitive snapshot.';
  elements.snapshotInsight.textContent = hasData
    ? buildSnapshotInsight(result, context)
    : 'NeuroMentor uses screen-time metadata, not message or page content.';
  elements.snapshotConfidence.textContent = `${confidence}%`;
  elements.snapshotConfidenceBar.style.setProperty('--confidence', confidence);

  elements.focusDetailScore.innerHTML = `${result.focus_score} <small>/ 100</small>`;
  elements.focusDetailLabel.textContent = hasData ? focusLabel : 'Not measured';
  elements.focusExplanation.textContent = hasData
    ? `Focus Potential estimates how well today's behavior supported sustained attention. ${focusBand.label} is the current product guidance band; scores below 35 trigger a support signal.`
    : 'Add a snapshot to explain your focus potential.';
  elements.focusConfidence.textContent = `${confidence}%`;
  if (elements.focusComparison) elements.focusComparison.textContent = comparisonText('focus');
  renderContributorList(elements.focusContributors, hasData ? contributors.focus : []);
  elements.fatigueScore.textContent = result.fatigue_score;
  elements.fatigueLabel.textContent = hasData
    ? fatigueBand.label
    : 'Not measured';
  elements.fatigueExplanation.textContent = hasData
    ? `Mental Fatigue estimates load from screen volume, timing, and recovery. ${fatigueBand.label} is the current product guidance band; scores of 45 or more are worth watching.`
    : 'Add a snapshot to reveal fatigue contributors.';
  elements.fatigueConfidence.textContent = `${confidence}%`;
  if (elements.fatigueComparison) elements.fatigueComparison.textContent = comparisonText('fatigue');
  renderContributorList(elements.fatigueContributors, hasData ? contributors.fatigue : []);
  elements.distractionScore.textContent = result.distraction_score;
  elements.distractionLabel.textContent = hasData
    ? distractionBand.label
    : 'Not measured';
  elements.distractionExplanation.textContent = hasData
    ? `Distraction Load estimates fragmentation from app mix and switching behavior. ${distractionBand.label} is the current product guidance band; scores of 45 or more are worth watching.`
    : 'Add a snapshot to reveal distraction contributors.';
  elements.distractionConfidence.textContent = `${confidence}%`;
  if (elements.distractionComparison) elements.distractionComparison.textContent = comparisonText('distraction');
  renderContributorList(elements.distractionContributors, hasData ? contributors.distraction : []);
  elements.burnoutRisk.textContent = hasData ? burnoutBand.label : 'Not measured';
  elements.burnoutScore.textContent = `${result.burnout_score} / 100`;
  elements.burnoutExplanation.textContent = hasData
    ? `Recovery Pressure combines behavioral load and recovery signals. ${burnoutBand.label} is the current product guidance band; this is not a diagnosis.`
    : 'Add a snapshot to explain recovery pressure.';
  elements.burnoutConfidence.textContent = `${confidence}%`;
  if (elements.burnoutComparison) elements.burnoutComparison.textContent = comparisonText('burnout');
  renderContributorList(elements.burnoutContributors, hasData ? contributors.burnout : []);
  elements.productiveRatio.textContent = `${Math.round(result.productive_ratio * 100)}%`;
  elements.totalTime.textContent = formatMinutes(result.total_minutes);
  renderBreakdown(result.usage);

  elements.insightList.innerHTML = result.insights
    .slice(0, 4)
    .map(insight => `<li>${escapeHtml(insight)}</li>`)
    .join('');

  const alert = result.alerts?.[0];
  elements.alertCard.classList.toggle('hidden', !alert);
  elements.alertCard.dataset.severity = alert?.severity || '';
  if (alert) {
    elements.alertSeverity.textContent = alert.severity;
    elements.alertTitle.textContent = alert.title;
    elements.alertMessage.textContent = alert.message;
    elements.alertReason.textContent = alert.reason;
    elements.alertAction.textContent = alert.action;
  }

  const recommendation = hasData
    ? result.primary_action?.action || result.recommendations?.[0]
    : 'Enter today\'s app usage to receive one clear, achievable next step.';
  elements.recommendationTitle.textContent = hasData
    ? result.primary_action?.title || 'One useful move for tomorrow'
    : 'Create your first baseline';
  elements.recommendationText.textContent = recommendation
    || 'Enter today\'s app usage and optional behavior signals to get a focused intervention.';
  elements.recommendationReason.textContent = hasData
    ? result.primary_action?.reason || result.insights?.[0] || 'This is the strongest available signal.'
    : 'Waiting for today\'s strongest signal.';
  elements.recommendationReview.textContent = hasData
    ? confidence >= 70
      ? 'Log tomorrow\'s snapshot and compare it with your personal baseline.'
      : 'Add optional context, rerun today, then compare again tomorrow.'
    : 'Create today\'s baseline, then check the same signals tomorrow.';

  renderBaseline(result, hasData);
  renderForecast(result, context, hasData);
  renderBehaviorImpacts(result, context, hasData);
  renderAchievements(result, hasData);
  elements.mentorContextTitle.textContent = hasData
    ? `${focusLabel} focus potential`
    : 'Waiting for a snapshot';
  elements.mentorContextDetail.textContent = hasData
    ? `${buildSnapshotInsight(result, context)}`
    : 'Analyze today to ground the conversation in your data.';
}

function upsertHistoryEntry(prediction, context) {
  activateSnapshot(Core.createDailySnapshot({
    date: localDateKey(),
    context,
    prediction,
    source: extractionState.items.length ? 'screenshot' : 'manual',
    extraction: extractionState,
  }));
  snapshots = Core.upsertSnapshot(snapshots, currentSnapshot);
  refreshHistoryView();
}

function recentTrendDays() {
  reconcileCurrentSnapshot();
  return Core.buildTrend(snapshots, localDateKey(), TREND_HISTORY_DAYS).slots.map(slot => {
    const date = new Date(`${slot.date}T12:00:00`);
    return {
      date: slot.date,
      label: date.toLocaleDateString(APP_LOCALE, { month: 'numeric', day: 'numeric' }),
      entry: slot.snapshot && slot.snapshot.validation.valid
        ? snapshotHistoryEntry(slot.snapshot)
        : null,
    };
  });
}

function renderTrends() {
  reconcileCurrentSnapshot();
  const days = recentTrendDays();
  const available = days.filter(day => day.entry);
  const coverageLabel = `${available.length} recorded ${available.length === 1 ? 'day' : 'days'}`;
  const averageFocus = available.length
    ? Math.round(
      available.reduce((sum, day) => sum + day.entry.focus_score, 0) / available.length,
    )
    : 0;
  const todayKey = localDateKey();
  let previousRecordedFocus = null;

  const dayMarkup = days.map((day, index) => {
    const date = new Date(`${day.date}T12:00:00`);
    const fullDate = date.toLocaleDateString(APP_LOCALE, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const isToday = day.date === todayKey;
    const positionClass = index < 2
      ? 'edge-start'
      : index > days.length - 3
        ? 'edge-end'
        : '';
    const dateMarkup = `
      <span class="trend-day-label">${escapeHtml(day.label)}</span>
      ${isToday ? '<span class="trend-today-label">Today</span>' : ''}
    `;

    if (!day.entry) {
      return `
        <div
          class="trend-day missing ${isToday ? 'today' : ''} ${positionClass}"
          style="--day-index: ${index}"
          tabindex="0"
          role="img"
          aria-label="${escapeHtml(fullDate)}: no snapshot recorded"
        >
          <div class="trend-bars">
            <div class="trend-placeholder" aria-hidden="true"><span>--</span></div>
          </div>
          <div class="trend-date">${dateMarkup}</div>
          <div class="trend-tooltip" role="tooltip" aria-hidden="true">
            <strong>${escapeHtml(fullDate)}</strong>
            <span>No snapshot recorded</span>
            <small>Excluded from your personal average.</small>
          </div>
        </div>
      `;
    }

    const focus = Math.round(Number(day.entry.focus_score) || 0);
    const fatigue = Math.round(Number(day.entry.fatigue_score) || 0);
    const focusChange = previousRecordedFocus === null ? null : focus - previousRecordedFocus;
    const comparison = focusChange === null
      ? 'First recorded day in this view'
      : focusChange === 0
        ? 'No focus change from the previous record'
        : `${focusChange > 0 ? '+' : ''}${focusChange} focus vs previous record`;
    previousRecordedFocus = focus;

    return `
      <div
        class="trend-day recorded ${isToday ? 'today' : ''} ${positionClass}"
        style="--day-index: ${index}"
        tabindex="0"
        role="img"
        aria-label="${escapeHtml(fullDate)}: focus ${focus} out of 100, fatigue ${fatigue} out of 100. ${escapeHtml(comparison)}."
      >
        <div class="trend-bars">
          <div class="trend-bar-track focus-track" aria-hidden="true">
            <div class="trend-bar focus ${focus === 0 ? 'zero' : ''}" style="--value: ${focus}"><span>${focus}</span></div>
          </div>
          <div class="trend-bar-track fatigue-track" aria-hidden="true">
            <div class="trend-bar fatigue ${fatigue === 0 ? 'zero' : ''}" style="--value: ${fatigue}"><span>${fatigue}</span></div>
          </div>
        </div>
        <div class="trend-date">${dateMarkup}</div>
        <div class="trend-tooltip" role="tooltip" aria-hidden="true">
          <strong>${escapeHtml(fullDate)}${isToday ? ' / Today' : ''}</strong>
          <span><i class="tooltip-focus"></i>Focus <b>${focus}</b></span>
          <span><i class="tooltip-fatigue"></i>Fatigue <b>${fatigue}</b></span>
          <small>${escapeHtml(comparison)}</small>
        </div>
      </div>
    `;
  }).join('');

  const baselinePosition = 38 + (averageFocus * 1.5);
  const baselineMarkup = available.length > 1
    ? `
      <div
        class="trend-baseline"
        style="--baseline-y: ${baselinePosition}px"
        aria-hidden="true"
      >
        <span>Your average ${averageFocus}</span>
      </div>
    `
    : '';
  elements.trendChart.style.setProperty('--trend-days', days.length);
  elements.trendChart.style.setProperty('--trend-width', `${days.length * 78}px`);
  elements.trendChart.innerHTML = `${baselineMarkup}${dayMarkup}`;
  elements.trendChart.setAttribute(
    'aria-label',
    `${days.length}-day focus score chart. ${coverageLabel}. Scroll horizontally to view older days.`,
  );
  const showTrendOnboarding = available.length === 0;
  elements.trendEmptyState.classList.toggle('hidden', !showTrendOnboarding);
  elements.trendCoverageNote?.classList.toggle('hidden', available.length !== 1);
  elements.trendChart.classList.toggle('hidden', showTrendOnboarding);
  elements.trendChartScroller?.classList.toggle('hidden', showTrendOnboarding);
  elements.trendScrollHint?.classList.toggle('hidden', showTrendOnboarding);
  elements.trendChartLegend.classList.toggle('hidden', showTrendOnboarding);
  elements.averageFocusDetail.textContent = coverageLabel;
  elements.averageFatigueDetail.textContent = coverageLabel;

  if (!available.length) {
    elements.averageFocus.textContent = '0';
    elements.averageFatigue.textContent = '0';
    elements.bestDay.textContent = '--';
    elements.trendRisk.textContent = 'Low';
    elements.trendDirection.className = 'state-chip neutral';
    elements.trendDirection.textContent = '0 days';
    elements.trendNote.textContent =
      'Add snapshots on multiple days to uncover your personal focus and fatigue pattern.';
    return;
  }

  const averageFatigue = Math.round(
    available.reduce((sum, day) => sum + day.entry.fatigue_score, 0) / available.length,
  );
  const best = available.reduce((current, day) => (
    !current || day.entry.focus_score > current.entry.focus_score ? day : current
  ), null);
  const first = available[0].entry.focus_score;
  const latest = available[available.length - 1].entry;
  const change = latest.focus_score - first;

  elements.averageFocus.textContent = averageFocus;
  elements.averageFatigue.textContent = averageFatigue;
  elements.bestDay.textContent = new Date(`${best.date}T12:00:00`).toLocaleDateString(
    APP_LOCALE,
    { weekday: 'short' },
  );
  elements.trendRisk.textContent = latest.burnout_risk;
  elements.trendDirection.className = `state-chip ${change < -5 ? 'danger' : change > 5 ? '' : 'neutral'}`;
  elements.trendDirection.textContent = available.length === 1
    ? '1 recorded day'
    : change > 5
      ? `Up ${change}`
      : change < -5
        ? `Down ${Math.abs(change)}`
        : 'Stable';
  elements.trendNote.textContent = available.length === 1
    ? 'Only one day is recorded. Generate one snapshot each day to build your personal trend.'
    : available.length < 3
      ? 'A few more daily snapshots will make your personal baseline more reliable.'
    : change > 5
      ? 'Focus is improving across the recorded period. Protect the routines behind your strongest day.'
      : change < -5
        ? 'Focus has softened across the recorded period. Check late-night use and app switching first.'
        : 'Your focus has been relatively stable. Small changes in recovery may produce the next gain.';

  requestAnimationFrame(() => {
    if (elements.trendChartScroller) {
      elements.trendChartScroller.scrollLeft = elements.trendChartScroller.scrollWidth;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addChatMessage(role, text, detail = '') {
  const article = document.createElement('article');
  article.className = `chat-message ${role === 'user' ? 'user-message' : 'mentor-message'}`;

  if (role === 'mentor') {
    const avatar = document.createElement('span');
    avatar.className = 'chat-avatar';
    avatar.textContent = 'NM';
    article.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  const message = document.createElement('p');
  message.textContent = text;
  bubble.appendChild(message);

  if (detail) {
    const small = document.createElement('small');
    small.textContent = detail;
    bubble.appendChild(small);
  }

  article.appendChild(bubble);
  elements.chatLog.appendChild(article);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function buildLocalMentorResponse(question) {
  const response = Core.buildMentorResponse(question, currentSnapshot, snapshots);
  return {
    language: response.language,
    intent: response.intent,
    answer: response.answer,
    evidence: [response.evidence],
    next_steps: [response.action],
    disclaimer: response.language === 'vi'
      ? 'Dữ liệu thời gian màn hình không thể chẩn đoán tình trạng y khoa hoặc sức khỏe tinh thần.'
      : 'Screen-time metadata cannot diagnose medical or mental-health conditions.',
  };
}

async function requestMentorResponse(question) {
  const fallback = buildLocalMentorResponse(question);
  const localIntents = new Set([
    'acknowledge', 'thanks', 'greeting', 'capabilities', 'screen_time', 'wellbeing', 'general',
  ]);
  if (localIntents.has(fallback.intent)) return fallback;
  if (!currentSnapshot.validation.valid) return fallback;

  const recentHistory = snapshots
    .filter(snapshot => snapshot.date < currentSnapshot.date && snapshot.validation.valid)
    .slice(-7)
    .map(snapshot => ({
      date: snapshot.date,
      focus_score: snapshot.result.focus_score,
      fatigue_score: snapshot.result.fatigue_score,
    }));
  try {
    const response = await fetchWithTimeout(`${API_BASE}/chat`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        question,
        context: currentSnapshot.context,
        recent_history: recentHistory,
      }),
    }, 2400);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const result = await response.json();
    return fallback.language === 'vi' && result.language !== 'vi' ? fallback : result;
  } catch {
    return fallback;
  }
}

async function handleMentorQuestion(question) {
  const cleaned = question.trim();
  if (!cleaned) return;

  addChatMessage('user', cleaned);
  elements.mentorQuestion.value = '';
  const response = await requestMentorResponse(cleaned);
  const evidence = (response.evidence || [])[0];
  const nextStep = (response.next_steps || [])[0];
  const labels = response.language === 'vi'
    ? { evidence: 'Dữ liệu', nextStep: 'Bước tiếp theo' }
    : { evidence: 'Evidence', nextStep: 'Next step' };
  const detail = [
    evidence ? `${labels.evidence}: ${evidence}` : '',
    nextStep ? `${labels.nextStep}: ${nextStep}` : '',
  ].filter(Boolean).join(' ');
  addChatMessage('mentor', response.answer, detail);

  chatHistory.push({ role: 'user', text: cleaned }, { role: 'mentor', text: response.answer, detail });
  chatHistory = chatHistory.slice(-20);
  await storageSet({ [STORAGE_KEYS.chat]: chatHistory });
}

function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCategory(appName) {
  const normalized = normalizeText(appName);
  return CATEGORIES.find(category => (
    CATEGORY_KEYWORDS[category].some(keyword => normalized.includes(keyword))
  )) || null;
}

const OCR_APP_KEYWORDS = CATEGORIES
  .flatMap(category => CATEGORY_KEYWORDS[category].map(keyword => ({ category, keyword })))
  .sort((left, right) => right.keyword.length - left.keyword.length);
const OCR_APP_ALIASES = [
  {
    key: 'facebook',
    name: 'Facebook',
    category: 'social',
    patterns: [/\bfacebook\b/, /\bface\s*book\b/, /\bf[ao]cebook\b/],
  },
  {
    key: 'messenger',
    name: 'Messenger',
    category: 'social',
    patterns: [/\bmessenger\b/, /\bmessage[rn]\b/, /\bmesse[nm]ger\b/],
  },
  {
    key: 'lien quan',
    name: 'Liên Quân Mobile',
    category: 'games',
    patterns: [/\bli.?n\s+qu.?n\b/, /\blien\s*quan\b/],
  },
  { key: 'tiktok', name: 'TikTok', category: 'entertainment', patterns: [/\btik\s*tok\b/] },
  { key: 'block blast', name: 'Block Blast!', category: 'games', patterns: [/\bblock\s*blast\b/] },
  { key: 'tai lieu', name: 'Tài liệu', category: 'productivity', patterns: [/\btai\s*lieu\b/] },
  { key: 'wormszone', name: 'WormsZone.io', category: 'games', patterns: [/\bworms?\s*zone(?:\.io)?\b/] },
  { key: 'mb bank', name: 'MB Bank', category: 'productivity', patterns: [/\bmb\s*bank\b/] },
  { key: 'grab', name: 'Grab', category: 'productivity', patterns: [/\b[gc]rab\b/] },
  { key: 'dich tflat', name: 'Dịch TFlat', category: 'learning', patterns: [/\bdich\s*t\s*flat\b/, /\btflat\b/] },
  { key: 'google', name: 'Google', category: 'productivity', patterns: [/\bgoogle\b/] },
];

function titleCase(value) {
  return value.replace(/\b\w/g, character => character.toUpperCase());
}

function inferOcrApp(text) {
  const normalized = normalizeText(text);
  const alias = OCR_APP_ALIASES.find(item => item.patterns.some(pattern => pattern.test(normalized)));
  if (alias) {
    return {
      key: alias.key,
      name: alias.name,
      category: alias.category,
    };
  }
  const match = OCR_APP_KEYWORDS.find(({ keyword }) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|\\s)${escaped}(?=$|[\\s.!()_-])`).test(normalized);
  });
  if (!match) return null;
  return {
    key: match.keyword,
    name: Core.extractAppNameCandidate(text) || titleCase(match.keyword),
    category: match.category,
  };
}

function canonicalizeKnownOcrItems(items) {
  return items.map(item => {
    if (!Core.extractAppNameCandidate(item.text)) return item;
    const recognizedApp = inferOcrApp(item.text);
    if (!recognizedApp) return item;
    const minutes = Core.parseScreenDuration(item.text);
    return {
      ...item,
      text: minutes === null ? recognizedApp.name : `${recognizedApp.name} ${minutes}m`,
    };
  });
}

function extractTextItems(detections) {
  return detections
    .filter(item => item.rawValue?.trim())
    .flatMap(item => {
      const box = item.boundingBox || { x: 0, y: 0, width: 0, height: 20 };
      const lines = item.rawValue.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const lineHeight = Math.max(1, box.height / Math.max(1, lines.length));
      return lines.map((text, index) => ({
        text,
        x: box.x,
        y: box.y + (index * lineHeight),
        width: box.width,
        height: lineHeight,
        confidence: 0.78,
      }));
    })
    .sort((left, right) => (left.y - right.y) || (left.x - right.x));
}

function extractTesseractItems(tsv = '') {
  const groups = new Map();
  tsv.split(/\r?\n/).slice(1).forEach(row => {
    const columns = row.split('\t');
    if (columns.length < 12 || columns[0] !== '5') return;
    const text = columns.slice(11).join('\t').trim();
    if (!text) return;
    const key = columns.slice(1, 5).join(':');
    const left = Number(columns[6]) || 0;
    const top = Number(columns[7]) || 0;
    const width = Number(columns[8]) || 0;
    const height = Number(columns[9]) || 20;
    const confidence = Math.max(0, Number(columns[10]) || 0);
    const group = groups.get(key) || {
      words: [], x: left, y: top, right: left + width, bottom: top + height, confidences: [],
    };
    group.words.push({ text, x: left });
    group.x = Math.min(group.x, left);
    group.y = Math.min(group.y, top);
    group.right = Math.max(group.right, left + width);
    group.bottom = Math.max(group.bottom, top + height);
    if (confidence > 0) group.confidences.push(confidence);
    groups.set(key, group);
  });

  return [...groups.values()].map(group => ({
    text: group.words.sort((left, right) => left.x - right.x).map(word => word.text).join(' '),
    x: group.x,
    y: group.y,
    width: group.right - group.x,
    height: group.bottom - group.y,
    confidence: group.confidences.length
      ? group.confidences.reduce((sum, value) => sum + value, 0) / group.confidences.length / 100
      : 0.55,
  })).sort((left, right) => (left.y - right.y) || (left.x - right.x));
}

async function enhanceScreenshotForOcr(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.max(1, Math.min(2, 1800 / bitmap.width));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const luminance = (image.data[index] * 0.299)
        + (image.data[index + 1] * 0.587)
        + (image.data[index + 2] * 0.114);
      const value = luminance >= 245
        ? 255
        : Math.max(0, Math.min(255, ((luminance - 205) * 3) + 128));
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
    }
    context.putImageData(image, 0, 0);
    return await new Promise(resolve => canvas.toBlob(blob => resolve(blob || file), 'image/png'));
  } finally {
    bitmap.close?.();
  }
}

function getExtensionAssetUrl(path) {
  if (globalThis.chrome?.runtime?.getURL) return chrome.runtime.getURL(path);
  return new URL(path, window.location.href).href;
}

function updateOcrProgress(message) {
  if (!message?.status) return;
  const labels = {
    'loading tesseract core': 'Loading local OCR engine',
    'initializing tesseract': 'Starting local OCR engine',
    'loading language traineddata': 'Loading English text model',
    'initializing api': 'Preparing screenshot reader',
    'recognizing text': 'Reading screenshot',
  };
  const label = labels[message.status] || message.status;
  const progress = Number.isFinite(message.progress)
    ? ` ${Math.round(message.progress * 100)}%`
    : '';
  setOcrStatus(`${label}${progress}...`, 'processing');
}

function getOcrWorker() {
  if (!globalThis.Tesseract?.createWorker) {
    return Promise.reject(new Error('The bundled OCR runtime did not load.'));
  }

  if (!ocrWorkerPromise) {
    const oem = globalThis.Tesseract.OEM?.LSTM_ONLY ?? 1;
    ocrWorkerPromise = globalThis.Tesseract.createWorker('eng', oem, {
      workerPath: getExtensionAssetUrl('vendor/tesseract/worker.min.js'),
      corePath: getExtensionAssetUrl('vendor/tesseract/core'),
      langPath: getExtensionAssetUrl('vendor/tesseract/lang'),
      workerBlobURL: false,
      logger: updateOcrProgress,
    }).catch(error => {
      ocrWorkerPromise = null;
      throw error;
    });
  }

  return ocrWorkerPromise;
}

async function recognizeScreenshot(file) {
  let nativeItems = [];
  if ('TextDetector' in globalThis) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const detections = await new TextDetector().detect(bitmap);
      nativeItems = canonicalizeKnownOcrItems(extractTextItems(detections));
    } catch {
      // Fall through to the bundled OCR engine when the experimental API fails.
    } finally {
      bitmap?.close?.();
    }
  }

  try {
    const worker = await getOcrWorker();
    const enhancedImage = await enhanceScreenshotForOcr(file);
    const result = await worker.recognize(
      enhancedImage,
      {},
      { blocks: true, text: true, hocr: false, tsv: true },
    );
    const items = extractTesseractItems(result.data?.tsv || '');
    const fallbackItems = (result.data?.text || '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map((text, index) => ({ text, x: 0, y: index * 24, width: 0, height: 20, confidence: 0.5 }));
    const tesseractItems = canonicalizeKnownOcrItems(items.length ? items : fallbackItems);
    return Core.pairOcrUsageRows(tesseractItems).length >= Core.pairOcrUsageRows(nativeItems).length
      ? tesseractItems
      : nativeItems;
  } catch (error) {
    if (nativeItems.length) return nativeItems;
    throw error;
  }
}

function parseDetectedUsage(items) {
  const usage = emptyUsage();
  const matches = Core.pairOcrUsageRows(canonicalizeKnownOcrItems(items)).map(match => {
    const recognizedApp = inferOcrApp(match.name);
    const category = recognizedApp?.category || inferCategory(match.name) || '';
    return {
      key: recognizedApp?.key || `unknown:${match.key}`,
      name: recognizedApp?.name || match.name,
      category,
      recognized: Boolean(recognizedApp),
      minutes: match.minutes,
      confidence: match.confidence,
      needsMinutes: false,
      needsCategory: !CATEGORIES.includes(category),
    };
  });
  matches.forEach(match => {
    if (CATEGORIES.includes(match.category)) usage[match.category] += match.minutes;
  });
  return { usage, matches };
}

function showScreenshotPreview(file) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  elements.screenshotPreview.src = previewUrl;
  elements.screenshotReview?.classList.remove('hidden');
}

function setOcrStatus(message, tone = '') {
  elements.ocrStatus.textContent = message;
  elements.ocrStatus.className = `import-status ${tone}`.trim();
}

function renderExtractionReview() {
  const items = extractionState.items || [];
  if (!items.length) {
    elements.ocrMatches.innerHTML = '';
    elements.ocrMatches.classList.add('hidden');
    elements.ocrConfidence?.classList.add('hidden');
    elements.applyExtraction?.classList.add('hidden');
    return;
  }

  elements.ocrMatches.innerHTML = items.map((item, index) => `
    <div class="ocr-review-row ${!item.category || (!item.minutes && item.category !== 'ignore') ? 'needs-review' : ''}" data-extraction-index="${index}">
      <label>
        <span>App</span>
        <input data-field="app" type="text" value="${escapeHtml(item.app)}" />
      </label>
      <label>
        <span>Category</span>
        <select data-field="category">
          <option value="" ${!item.category ? 'selected' : ''}>Choose category</option>
          ${CATEGORIES.map(category => `
            <option value="${category}" ${item.category === category ? 'selected' : ''}>
              ${CATEGORY_LABELS[category]}
            </option>
          `).join('')}
          <option value="ignore" ${item.category === 'ignore' ? 'selected' : ''}>Ignore app</option>
        </select>
      </label>
      <label>
        <span>Minutes</span>
        <input data-field="minutes" type="number" min="0" max="1440" value="${item.minutes}" />
      </label>
      <span class="ocr-row-confidence">${
        !item.category
          ? 'Choose what kind of app this is'
          : !item.minutes && item.category !== 'ignore'
            ? 'Enter the app usage in minutes'
            : `${Math.round(item.confidence * 100)}% extraction confidence`
      }</span>
    </div>
  `).join('');
  elements.ocrMatches.classList.remove('hidden');
  elements.ocrConfidence.textContent = `Overall extraction confidence: ${Math.round(extractionState.confidence * 100)}%. Review every value before applying.`;
  elements.ocrConfidence.classList.remove('hidden');
  elements.applyExtraction.classList.remove('hidden');
  elements.applyExtraction.textContent = extractionState.reviewed
    ? 'Values applied'
    : 'Apply reviewed values';
}

function updateExtractionItem(event) {
  const row = event.target.closest('[data-extraction-index]');
  const field = event.target.dataset.field;
  if (!row || !field) return;
  const index = Number(row.dataset.extractionIndex);
  const item = extractionState.items[index];
  if (!item) return;
  item[field] = field === 'minutes'
    ? Math.max(0, Math.round(Number(event.target.value) || 0))
    : event.target.value;
  extractionState.reviewed = false;
  const needsReview = !item.category || (item.category !== 'ignore' && !item.minutes);
  row.classList.toggle('needs-review', needsReview);
  const reviewMessage = row.querySelector('.ocr-row-confidence');
  if (reviewMessage) {
    reviewMessage.textContent = !item.category
      ? 'Choose what kind of app this is'
      : !item.minutes && item.category !== 'ignore'
        ? 'Enter the app usage in minutes'
        : `${Math.round(item.confidence * 100)}% extraction confidence`;
  }
  elements.applyExtraction.textContent = 'Apply reviewed values';
}

function applyExtractedValues() {
  if (!extractionState.items.length) return;
  const incomplete = extractionState.items.find(item => (
    !item.category || (item.category !== 'ignore' && (!item.minutes || item.minutes <= 0))
  ));
  if (incomplete) {
    setOcrStatus(
      `Review ${incomplete.app}: choose a category and enter its screen time, or select Ignore app.`,
      'error',
    );
    renderExtractionReview();
    const row = elements.ocrMatches.querySelector(
      `[data-extraction-index="${extractionState.items.indexOf(incomplete)}"]`,
    );
    row?.querySelector(!incomplete.category ? '[data-field="category"]' : '[data-field="minutes"]')?.focus();
    return;
  }
  const includedItems = extractionState.items.filter(item => (
    CATEGORIES.includes(item.category) && item.minutes > 0
  ));
  if (!includedItems.length) {
    setOcrStatus('Choose a category and enter minutes for at least one app before applying.', 'error');
    return;
  }
  const usage = emptyUsage();
  extractionState.items.forEach(item => {
    if (CATEGORIES.includes(item.category)) usage[item.category] += Math.max(0, Number(item.minutes) || 0);
  });
  CATEGORIES.forEach(category => {
    document.getElementById(category).value = usage[category];
  });
  extractionState.reviewed = true;
  renderExtractionReview();
  renderValidation(Core.validateContext(collectContext()));
  setOcrStatus('Reviewed screenshot values have been applied. You can still edit category totals.', 'success');
}

function removeScreenshot() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  elements.screenshotPreview.removeAttribute('src');
  elements.screenshotReview?.classList.add('hidden');
  extractionState = { status: 'idle', confidence: 0, reviewed: true, items: [], error: '' };
  renderExtractionReview();
  setOcrStatus('Upload, drop, or paste a screen-time screenshot.');
}

async function processScreenshot(file) {
  if (!file?.type.startsWith('image/')) {
    setOcrStatus('The selected clipboard item is not an image.', 'error');
    return;
  }

  showScreenshotPreview(file);
  elements.ocrMatches.classList.add('hidden');
  elements.ocrMatches.innerHTML = '';

  extractionState = { status: 'processing', confidence: 0, reviewed: false, items: [], error: '' };
  elements.importDropZone?.classList.add('is-processing');
  setOcrStatus('Processing the screenshot locally...', 'processing');

  try {
    const ocrItems = await recognizeScreenshot(file);
    const screenshotType = Core.classifyUsageScreenshot(ocrItems);

    if (screenshotType.kind === 'battery-percentages' || screenshotType.kind === 'percentage-only') {
      const batteryScreenshot = screenshotType.kind === 'battery-percentages';
      const message = batteryScreenshot
        ? 'This is a battery-usage screen. Battery percentages do not show how long each app was used, so they cannot be converted into screen-time minutes. Open Digital Wellbeing > Dashboard, then upload a screenshot showing a duration for each app.'
        : 'This screenshot shows percentages but no app usage durations. NeuroMentor cannot safely convert percentages into minutes. Upload a Screen Time or Digital Wellbeing screenshot that shows time for each app.';
      extractionState = {
        status: 'error',
        confidence: 0,
        reviewed: false,
        items: [],
        error: message,
      };
      renderExtractionReview();
      setOcrStatus(message, 'warning');
      return;
    }

    const { matches } = parseDetectedUsage(ocrItems);

    if (!matches.length) {
      extractionState = {
        status: 'error',
        confidence: 0,
        reviewed: false,
        items: [],
        error: 'No recognizable app-and-time rows were found.',
      };
      setOcrStatus('No recognizable app-and-time rows were found. Enter the totals manually.', 'error');
      return;
    }

    const items = matches.slice(0, 20).map(match => ({
      app: match.name,
      category: match.category || '',
      minutes: match.minutes,
      confidence: Math.max(0.35, Math.min(0.96,
        match.confidence + (match.recognized ? 0.08 : 0),
      )),
    }));
    extractionState = {
      status: 'ready',
      confidence: items.reduce((sum, item) => sum + item.confidence, 0) / items.length,
      reviewed: false,
      items,
      error: '',
    };
    renderExtractionReview();
    const needsCategory = items.filter(item => !item.category).length;
    setOcrStatus(
      needsCategory
        ? `Detected ${matches.length} apps with usage times. Choose a category for ${needsCategory} unknown app${needsCategory === 1 ? '' : 's'}.`
        : `Detected ${matches.length} apps and filled their usage times automatically. Review before applying.`,
      needsCategory ? 'warning' : 'success',
    );
  } catch (error) {
    console.error('Screenshot OCR failed:', error);
    extractionState = {
      status: 'error',
      confidence: 0,
      reviewed: false,
      items: [],
      error: 'The screenshot could not be read.',
    };
    setOcrStatus('The screenshot could not be read. Try a sharper crop with app names and times.', 'error');
  } finally {
    elements.importDropZone?.classList.remove('is-processing');
  }
}

async function handleAnalysisSubmit(event) {
  event.preventDefault();
  await rolloverWorkspaceDay();
  currentContext = collectContext();
  const validation = renderValidation(Core.validateContext(currentContext));

  if (!validation.valid) {
    elements.analysisStatus.textContent = 'Review the highlighted totals before creating the snapshot.';
    elements.analysisStatus.className = 'form-status error';
    return;
  }
  if (extractionState.items.length && !extractionState.reviewed) {
    elements.analysisStatus.textContent = 'Review and apply the extracted screenshot values before saving.';
    elements.analysisStatus.className = 'form-status error';
    elements.applyExtraction?.focus();
    return;
  }

  elements.analyzeButton.disabled = true;
  elements.analyzeButton.textContent = 'Building snapshot...';
  elements.analysisStatus.textContent = '';

  try {
    currentPrediction = await requestPrediction(currentContext);
    setEngineStatus(currentPrediction.source);
    upsertHistoryEntry(currentPrediction, currentContext);
    workspaceDate = localDateKey();
    await persistSnapshots();
    if (appMode === 'account') {
      renderReminderSettings('Today is complete. The email reminder will be skipped.');
    }
    renderOverview(currentSnapshot);
    renderTrends();
    void syncUsageToAccount(currentContext.usage);
    elements.analysisStatus.textContent = appMode === 'offline'
      ? 'Snapshot saved for this tab. Closing the tab resets offline data.'
      : currentPrediction.source === 'cloud'
        ? 'Snapshot saved successfully and analyzed with the API.'
        : 'Snapshot saved locally. The analysis API is not configured or unavailable.';
    elements.analysisStatus.className = `form-status ${currentPrediction.source === 'cloud' ? 'success' : 'warning'}`;
    switchScreen('overview');
  } catch (error) {
    console.error('Snapshot save failed:', error);
    elements.analysisStatus.textContent = 'The snapshot could not be saved. Your reviewed values remain in the form.';
    elements.analysisStatus.className = 'form-status error';
  } finally {
    elements.analyzeButton.disabled = false;
    elements.analyzeButton.textContent = 'Generate cognitive snapshot';
  }
}

function bindEvents() {
  elements.showLogin?.addEventListener('click', () => setAuthMode('login'));
  elements.showSignup?.addEventListener('click', () => setAuthMode('signup'));
  elements.loginForm?.addEventListener('submit', event => {
    event.preventDefault();
    handleAuthentication('login');
  });
  elements.signupForm?.addEventListener('submit', event => {
    event.preventDefault();
    handleAuthentication('signup');
  });
  elements.offlineButton?.addEventListener('click', continueOffline);
  elements.accountButton?.addEventListener('click', () => {
    if (elements.accountPanel.classList.contains('hidden')) openAccountPanel();
    else closeAccountPanel();
  });
  elements.closeAccount?.addEventListener('click', closeAccountPanel);
  elements.accountBackdrop?.addEventListener('click', closeAccountPanel);
  elements.accountPanel?.addEventListener('keydown', handleAccountPanelKeydown);
  elements.accountPhoneRow?.addEventListener('click', openPhoneEditor);
  elements.accountPasswordRow?.addEventListener('click', openPasswordEditor);
  elements.savePhone?.addEventListener('click', () => void savePhoneNumber());
  elements.cancelPhone?.addEventListener('click', () => closeSettingsEditor('phone'));
  elements.phoneInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void savePhoneNumber();
    }
  });
  elements.savePassword?.addEventListener('click', () => void savePasswordChange());
  elements.cancelPassword?.addEventListener('click', () => closeSettingsEditor('password'));
  elements.themeToggle?.addEventListener('change', () => {
    applyTheme(elements.themeToggle.checked ? 'dark' : 'light', true);
  });
  elements.reminderEnabled?.addEventListener('change', saveReminderSettings);
  elements.reminderTime?.addEventListener('change', saveReminderSettings);
  elements.testReminder?.addEventListener('click', sendTestReminder);
  elements.accountAction?.addEventListener('click', () => {
    if (elements.accountAction.dataset.action === 'logout') {
      logout();
    } else {
      showAuthView();
    }
  });

  document.querySelectorAll('[data-screen-target]').forEach(button => {
    button.addEventListener('click', () => switchScreen(button.dataset.screenTarget));
  });

  elements.analysisForm?.addEventListener('submit', handleAnalysisSubmit);
  elements.analysisForm?.addEventListener('input', () => {
    renderValidation(Core.validateContext(collectContext()), false);
  });
  elements.mentorForm?.addEventListener('submit', event => {
    event.preventDefault();
    handleMentorQuestion(elements.mentorQuestion?.value || '');
  });
  document.querySelectorAll('[data-question]').forEach(button => {
    button.addEventListener('click', () => handleMentorQuestion(button.dataset.question));
  });
  elements.screenshotInput?.addEventListener('change', event => {
    const [file] = event.target.files || [];
    processScreenshot(file);
    event.target.value = '';
  });
  elements.removeScreenshot?.addEventListener('click', removeScreenshot);
  elements.applyExtraction?.addEventListener('click', applyExtractedValues);
  elements.ocrMatches?.addEventListener('input', updateExtractionItem);
  elements.ocrMatches?.addEventListener('change', updateExtractionItem);
  ['dragenter', 'dragover'].forEach(type => {
    elements.importDropZone?.addEventListener(type, event => {
      event.preventDefault();
      elements.importDropZone.classList.add('is-dragging');
    });
  });
  ['dragleave', 'drop'].forEach(type => {
    elements.importDropZone?.addEventListener(type, event => {
      event.preventDefault();
      elements.importDropZone.classList.remove('is-dragging');
    });
  });
  elements.importDropZone?.addEventListener('drop', event => {
    const file = [...(event.dataTransfer?.files || [])]
      .find(item => item.type.startsWith('image/'));
    if (file) processScreenshot(file);
    else setOcrStatus('Drop an image file such as PNG, JPG, or WebP.', 'error');
  });
  document.addEventListener('paste', event => {
    const imageItem = Array.from(event.clipboardData?.items || [])
      .find(item => item.kind === 'file' && item.type.startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    event.preventDefault();
    elements.pasteZone?.classList.add('is-pasting');
    processScreenshot(file).finally(() => elements.pasteZone?.classList.remove('is-pasting'));
  });
  window.addEventListener('focus', () => {
    void rolloverWorkspaceDay();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void rolloverWorkspaceDay();
  });
}

async function restoreWorkspaceState(stored) {
  const today = localDateKey();
  const legacyHistory = Array.isArray(stored[STORAGE_KEYS.history]) ? stored[STORAGE_KEYS.history] : [];
  const storedSnapshots = Array.isArray(stored[STORAGE_KEYS.snapshots])
    ? stored[STORAGE_KEYS.snapshots]
    : Core.migrateLegacyState({
        context: stored[STORAGE_KEYS.context],
        prediction: stored[STORAGE_KEYS.prediction],
        history: legacyHistory,
        date: stored[STORAGE_KEYS.snapshotDate] || latestHistoryDate(legacyHistory) || today,
      });
  snapshots = Core.uniqueSnapshots(storedSnapshots);
  refreshHistoryView();
  const hasStoredSnapshot = Boolean(
    snapshots.length || stored[STORAGE_KEYS.context] || stored[STORAGE_KEYS.prediction],
  );
  const todaySnapshot = snapshots.find(snapshot => snapshot.date === today) || null;
  const hasTodaySnapshot = Boolean(todaySnapshot);
  const rolledOver = hasStoredSnapshot && !hasTodaySnapshot;

  workspaceDate = today;
  activateSnapshot(todaySnapshot || Core.createDailySnapshot({ date: today }));
  chatHistory = Array.isArray(stored[STORAGE_KEYS.chat]) ? stored[STORAGE_KEYS.chat] : [];

  populateContext(currentContext);
  renderOverview(currentSnapshot);
  renderTrends();
  if (!Array.isArray(stored[STORAGE_KEYS.snapshots])) {
    await persistSnapshots();
  }
  await storageRemove([
    STORAGE_KEYS.context,
    STORAGE_KEYS.prediction,
    STORAGE_KEYS.snapshotDate,
    STORAGE_KEYS.history,
  ]);
  if (rolledOver) {
    showNewDayStatus();
  }

  elements.chatLog.querySelectorAll('.chat-message:not(:first-child)').forEach(message => message.remove());
  chatHistory.slice(-8).forEach(message => {
    addChatMessage(message.role, message.text, message.detail || '');
  });
}

async function initialize() {
  bindEvents();
  bindSnapshotStorageSync();
  setAuthMode('login');

  const persistentStored = await persistentStorageGet(Object.values(STORAGE_KEYS));
  const storedToken = persistentStored[STORAGE_KEYS.authToken];
  const restoringOffline = !storedToken && persistentStored[STORAGE_KEYS.appMode] === 'offline';
  appMode = restoringOffline ? 'offline' : 'signed-out';
  const offlineWorkspace = restoringOffline
    ? await sessionDataGet(WORKSPACE_STORAGE_KEYS)
    : {};
  const stored = { ...persistentStored, ...offlineWorkspace };

  themePreference = stored[STORAGE_KEYS.theme] === 'dark' ? 'dark' : 'light';
  applyTheme(themePreference);
  localUserId = stored[STORAGE_KEYS.localUserId] || createLocalUserId();
  if (!stored[STORAGE_KEYS.localUserId]) {
    await storageSet({ [STORAGE_KEYS.localUserId]: localUserId });
  }
  phoneNumber = typeof stored[STORAGE_KEYS.phoneNumber] === 'string'
    ? stored[STORAGE_KEYS.phoneNumber]
    : '';

  await restoreWorkspaceState(stored);
  accountDeviceId = stored[STORAGE_KEYS.devicePlatform] === clientPlatform()
    ? stored[STORAGE_KEYS.deviceId] || null
    : null;
  setupReminderTimeOptions();
  renderReminderSettings();

  if (storedToken) {
    setAuthStatus('Restoring your account...');
    const restored = await restoreAccountSession(storedToken, stored[STORAGE_KEYS.authUser]);
    if (!restored) showAuthView('Your session expired. Please log in again.');
    return;
  }

  if (stored[STORAGE_KEYS.appMode] === 'offline') {
    appMode = 'offline';
    showWorkspace();
    setEngineStatus(currentPrediction?.source || 'local');
    return;
  }

  showAuthView();
}

initialize().catch(error => {
  console.error('NeuroMentor popup failed to initialize:', error);
});
