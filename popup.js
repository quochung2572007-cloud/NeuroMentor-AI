const API_ROOT = globalThis.NEUROMENTOR_CONFIG?.apiRoot || 'http://localhost:8000/v1';
const API_BASE = `${API_ROOT}/intelligence`;
const APP_LOCALE = 'en-US';
const STORAGE_KEYS = {
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
};
const DEFAULT_REMINDER = {
  enabled: false,
  time: '20:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  deliveryConfigured: false,
  destinationEmail: '',
  lastSentAt: null,
};

const CATEGORIES = ['social', 'productivity', 'games', 'learning', 'health', 'entertainment'];
const CATEGORY_LABELS = {
  social: 'Social',
  productivity: 'Productivity',
  games: 'Games',
  learning: 'Learning',
  health: 'Health',
  entertainment: 'Entertainment',
};
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
  accountAvatar: document.getElementById('account-avatar'),
  accountPanel: document.getElementById('account-panel'),
  accountAvatarLarge: document.getElementById('account-avatar-large'),
  accountEmail: document.getElementById('account-email'),
  accountMemberSince: document.getElementById('account-member-since'),
  accountSyncTitle: document.getElementById('account-sync-title'),
  accountSyncStatus: document.getElementById('account-sync-status'),
  accountAction: document.getElementById('account-action'),
  closeAccount: document.getElementById('close-account'),
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
  focusExplanation: document.getElementById('focus-explanation'),
  focusContributors: document.getElementById('focus-contributors'),
  focusConfidence: document.getElementById('focus-confidence'),
  fatigueScore: document.getElementById('fatigue-score'),
  fatigueLabel: document.getElementById('fatigue-label'),
  fatigueExplanation: document.getElementById('fatigue-explanation'),
  fatigueContributors: document.getElementById('fatigue-contributors'),
  fatigueConfidence: document.getElementById('fatigue-confidence'),
  distractionScore: document.getElementById('distraction-score'),
  distractionLabel: document.getElementById('distraction-label'),
  distractionExplanation: document.getElementById('distraction-explanation'),
  distractionContributors: document.getElementById('distraction-contributors'),
  distractionConfidence: document.getElementById('distraction-confidence'),
  burnoutRisk: document.getElementById('burnout-risk'),
  burnoutScore: document.getElementById('burnout-score'),
  burnoutExplanation: document.getElementById('burnout-explanation'),
  burnoutContributors: document.getElementById('burnout-contributors'),
  burnoutConfidence: document.getElementById('burnout-confidence'),
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
  recommendationTitle: document.getElementById('recommendation-title'),
  recommendationText: document.getElementById('recommendation-text'),
  analysisForm: document.getElementById('analysis-form'),
  analyzeButton: document.getElementById('analyze-button'),
  analysisStatus: document.getElementById('analysis-status'),
  screenshotInput: document.getElementById('screenshot-input'),
  screenshotPreview: document.getElementById('screenshot-preview'),
  pasteZone: document.getElementById('paste-zone'),
  ocrStatus: document.getElementById('ocr-status'),
  ocrMatches: document.getElementById('ocr-matches'),
  trendChart: document.getElementById('trend-chart'),
  trendDirection: document.getElementById('trend-direction'),
  averageFocus: document.getElementById('average-focus'),
  averageFocusDetail: document.getElementById('average-focus-detail'),
  averageFatigue: document.getElementById('average-fatigue'),
  averageFatigueDetail: document.getElementById('average-fatigue-detail'),
  bestDay: document.getElementById('best-day'),
  trendRisk: document.getElementById('trend-risk'),
  trendNote: document.getElementById('trend-note'),
  trendEmptyState: document.getElementById('trend-empty-state'),
  trendChartLegend: document.getElementById('trend-chart-legend'),
  chatLog: document.getElementById('chat-log'),
  mentorForm: document.getElementById('mentor-form'),
  mentorQuestion: document.getElementById('mentor-question'),
  mentorContextTitle: document.getElementById('mentor-context-title'),
  mentorContextDetail: document.getElementById('mentor-context-detail'),
};

let currentContext = emptyContext();
let currentPrediction = null;
let history = [];
let workspaceDate = localDateKey();
let chatHistory = [];
let previewUrl = null;
let ocrWorkerPromise = null;
let authToken = null;
let currentUser = null;
let appMode = 'signed-out';
let accountDeviceId = null;
let reminderSettings = { ...DEFAULT_REMINDER };

function emptyUsage() {
  return Object.fromEntries(CATEGORIES.map(category => [category, 0]));
}

function emptyContext() {
  return {
    usage: emptyUsage(),
    app_switches: 0,
    late_night_minutes: 0,
    deep_work_minutes: 0,
    launch_count: 0,
  };
}

function clamp(value, minimum = 0, maximum = 100) {
  return Math.round(Math.max(minimum, Math.min(maximum, value)));
}

function ratio(value, total) {
  return value / Math.max(total, 1);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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

function storageGet(keys) {
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

function storageSet(values) {
  if (globalThis.chrome?.storage?.local) {
    return new Promise(resolve => chrome.storage.local.set(values, resolve));
  }

  Object.entries(values).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  return Promise.resolve();
}

function storageRemove(keys) {
  if (globalThis.chrome?.storage?.local) {
    return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
  }

  keys.forEach(key => localStorage.removeItem(key));
  return Promise.resolve();
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
  currentContext = emptyContext();
  currentPrediction = null;
  populateContext(currentContext);
  renderOverview(null);

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  elements.screenshotPreview.removeAttribute('src');
  elements.screenshotPreview.classList.add('hidden');
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
  const cloud = source === 'cloud';
  elements.engineStatus?.classList.toggle('cloud', cloud);
  const label = elements.engineStatus?.querySelector('span:last-child');
  if (label) label.textContent = cloud ? 'API' : 'Local';
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

  return {
    usage,
    app_switches: Math.max(0, Number(document.getElementById('app-switches').value) || 0),
    late_night_minutes: Math.max(0, Number(document.getElementById('late-night-minutes').value) || 0),
    deep_work_minutes: Math.max(0, Number(document.getElementById('deep-work-minutes').value) || 0),
    launch_count: Math.max(0, Number(document.getElementById('launch-count').value) || 0),
  };
}

function populateContext(context) {
  const safeContext = context || emptyContext();
  CATEGORIES.forEach(category => {
    document.getElementById(category).value = safeContext.usage?.[category] || 0;
  });
  document.getElementById('app-switches').value = safeContext.app_switches || 0;
  document.getElementById('late-night-minutes').value = safeContext.late_night_minutes || 0;
  document.getElementById('deep-work-minutes').value = safeContext.deep_work_minutes || 0;
  document.getElementById('launch-count').value = safeContext.launch_count || 0;
}

function buildAlert(alertType, severity, title, message, reason, action) {
  return { alert_type: alertType, severity, title, message, reason, action };
}

function predictLocally(context) {
  const usage = Object.fromEntries(
    CATEGORIES.map(category => [category, Math.max(0, Number(context.usage[category]) || 0)]),
  );
  const totalMinutes = Object.values(usage).reduce((sum, minutes) => sum + minutes, 0);
  const productiveMinutes = usage.productivity + usage.learning;
  const productiveRatio = ratio(productiveMinutes, totalMinutes);
  const socialRatio = ratio(usage.social, totalMinutes);
  const entertainmentRatio = ratio(usage.games + usage.entertainment, totalMinutes);
  const recoveryRatio = ratio(usage.health, totalMinutes);
  const deepWorkRatio = ratio(context.deep_work_minutes, totalMinutes);
  const lateNightRatio = ratio(context.late_night_minutes, totalMinutes);
  const usageHours = Math.max(totalMinutes / 60, 1);
  const switchRate = context.app_switches / usageHours;
  const launchRate = context.launch_count / usageHours;

  const switchPenalty = Math.min(28, switchRate * 1.7);
  const launchPenalty = Math.min(12, launchRate * 0.35);
  const latePenalty = Math.min(24, lateNightRatio * 45);
  const overloadPenalty = Math.min(22, Math.max(0, totalMinutes - 240) / 12);

  let focusScore = clamp(
    42
    + productiveRatio * 48
    + deepWorkRatio * 24
    + recoveryRatio * 10
    - socialRatio * 20
    - entertainmentRatio * 16
    - switchPenalty
    - latePenalty,
  );
  let fatigueScore = clamp(
    12
    + overloadPenalty * 2.1
    + lateNightRatio * 48
    + entertainmentRatio * 15
    + Math.min(14, switchRate * 0.9)
    - recoveryRatio * 24,
  );
  let distractionScore = clamp(
    8
    + socialRatio * 38
    + entertainmentRatio * 34
    + switchPenalty * 1.45
    + launchPenalty
    - deepWorkRatio * 24,
  );
  let burnoutScore = clamp(
    fatigueScore * 0.52
    + distractionScore * 0.18
    + lateNightRatio * 24
    + Math.max(0, totalMinutes - 360) / 8
    + Math.max(0, productiveRatio - 0.75) * 20
    - recoveryRatio * 15,
  );

  if (!totalMinutes) {
    focusScore = 0;
    fatigueScore = 0;
    distractionScore = 0;
    burnoutScore = 0;
  }
  const burnoutRisk = burnoutScore >= 70 ? 'high' : burnoutScore >= 42 ? 'moderate' : 'low';
  const topCategory = totalMinutes
    ? CATEGORIES.reduce((best, category) => usage[category] > usage[best] ? category : best)
    : 'none';
  const telemetryFields = [
    context.app_switches,
    context.late_night_minutes,
    context.deep_work_minutes,
    context.launch_count,
  ].filter(value => value > 0).length;

  const insights = [];
  const recommendations = [];
  const alerts = [];

  if (totalMinutes) {
    insights.push(
      productiveRatio >= 0.5
        ? `Productive and learning activity made up ${Math.round(productiveRatio * 100)}% of screen time.`
        : `Only ${Math.round(productiveRatio * 100)}% of screen time supported focused work or learning.`,
    );
    insights.push(
      context.deep_work_minutes >= 50
        ? `You logged ${context.deep_work_minutes} minutes of deeper focus activity.`
        : 'No sustained deep-work block was recorded for this day.',
    );
  } else {
    insights.push('Add today\'s usage to establish your first cognitive baseline.');
  }

  if (switchRate >= 12) {
    insights.push(`Your switching rate was ${switchRate.toFixed(1)} changes per screen-time hour.`);
    alerts.push(buildAlert(
      'attention_fragmentation',
      switchRate >= 20 ? 'high' : 'medium',
      'Attention fragmentation',
      'Frequent app switching can make it harder to settle into demanding work.',
      `Estimated switching rate: ${switchRate.toFixed(1)} per hour.`,
      'Silence nonessential notifications and protect one 25-minute focus block.',
    ));
  }

  if (socialRatio >= 0.35) {
    alerts.push(buildAlert(
      'excessive_social_media',
      socialRatio >= 0.5 ? 'high' : 'medium',
      'Social overload',
      'Social apps are taking a large share of today\'s attention.',
      `Social usage represented ${Math.round(socialRatio * 100)}% of total screen time.`,
      'Set one social check-in window and move the apps off the home screen.',
    ));
  }

  if (context.late_night_minutes >= 90) {
    insights.push(`${context.late_night_minutes} minutes of use happened late at night.`);
    alerts.push(buildAlert(
      'sleep_disruption',
      context.late_night_minutes >= 180 ? 'high' : 'medium',
      'Recovery may be disrupted',
      'Late-night screen use can reduce the quality of mental recovery.',
      `Late-night usage reached ${context.late_night_minutes} minutes.`,
      'Create a 30-minute screen-free buffer before sleep tonight.',
    ));
  }

  if (burnoutRisk === 'high') {
    alerts.push(buildAlert(
      'burnout_warning',
      'high',
      'Elevated overload pattern',
      'Today\'s pattern combines fatigue, screen load, and limited recovery signals.',
      `Burnout tendency score reached ${burnoutScore}/100.`,
      'Reduce optional screen load and schedule a real recovery block.',
    ));
  }

  if (recoveryRatio < 0.08 && totalMinutes >= 120) {
    recommendations.push('Add a short walk, breathing session, or device-free recovery break.');
  }
  if (distractionScore >= 55) {
    recommendations.push('Use Focus mode for 25 minutes and keep only one task visible.');
  }
  if (fatigueScore >= 55) {
    recommendations.push('Move demanding work earlier and stop high-stimulation use before bed.');
  }
  if (productiveRatio < 0.4 && totalMinutes) {
    recommendations.push('Reserve the first 30 minutes tomorrow for learning or priority work.');
  }
  if (totalMinutes && context.deep_work_minutes < 50) {
    recommendations.push('Schedule one uninterrupted 25-minute deep-work block tomorrow.');
  }
  if (!totalMinutes) {
    recommendations.push('Add today\'s usage to create your first personal baseline.');
  }
  if (!recommendations.length) {
    recommendations.push('Keep the current balance and protect the habits that supported it.');
  }

  return {
    focus_score: focusScore,
    fatigue_score: fatigueScore,
    distraction_score: distractionScore,
    burnout_score: burnoutScore,
    burnout_risk: burnoutRisk,
    confidence: Math.min(0.92, 0.68 + telemetryFields * 0.06),
    total_minutes: totalMinutes,
    productive_ratio: productiveRatio,
    social_ratio: socialRatio,
    recovery_ratio: recoveryRatio,
    deep_work_ratio: deepWorkRatio,
    late_night_ratio: lateNightRatio,
    switch_rate: switchRate,
    top_category: topCategory,
    usage,
    insights,
    recommendations,
    alerts,
    model_version: 'hybrid-rules-v2-local',
    source: 'local',
  };
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
    elements.accountMemberSince.textContent = 'Stored only on this device';
    elements.accountSyncTitle.textContent = 'Local mode';
    elements.accountSyncStatus.textContent = 'Your analysis remains in this browser.';
    elements.accountAction.textContent = 'Log in or create account';
    elements.accountAction.dataset.action = 'login';
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
  currentContext = emptyContext();
  currentPrediction = null;
  history = [];
  chatHistory = [];
  workspaceDate = localDateKey();
  populateContext(currentContext);
  renderOverview(null);
  renderTrends();
  elements.chatLog.querySelectorAll('.chat-message:not(:first-child)').forEach(message => message.remove());
  await storageRemove([
    STORAGE_KEYS.context,
    STORAGE_KEYS.prediction,
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
  await claimWorkspace(user.id);
  authToken = token;
  currentUser = user;
  appMode = 'account';
  await storageSet({
    [STORAGE_KEYS.authToken]: token,
    [STORAGE_KEYS.authUser]: user,
    [STORAGE_KEYS.appMode]: 'account',
  });
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
  await claimWorkspace('offline');
  authToken = null;
  currentUser = null;
  accountDeviceId = null;
  appMode = 'offline';
  await storageSet({ [STORAGE_KEYS.appMode]: 'offline' });
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
  try {
    const response = await fetchWithTimeout(`${API_BASE}/predict`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(context),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const prediction = await response.json();
    prediction.source = 'cloud';
    return prediction;
  } catch {
    return predictLocally(context);
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

function supportiveScoreLabel(metric, score) {
  if (metric === 'focus') {
    if (score >= 70) return 'Well supported';
    if (score >= 45) return 'Building momentum';
    return 'Needs attention';
  }
  if (metric === 'burnout') {
    if (score >= 70) return 'Recovery priority';
    if (score >= 42) return 'Watch your load';
    return 'Low pressure';
  }
  if (score <= 30) return 'Well managed';
  if (score <= 55) return 'Worth watching';
  return 'Needs support';
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
    Math.round(result.confidence * 100) - 20 + Math.min(history.length * 3, 12),
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
    : result.burnout_risk === 'moderate'
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

function renderOverview(prediction) {
  const result = prediction || predictLocally(emptyContext());
  const hasData = result.total_minutes > 0;
  const context = hasData ? currentContext : emptyContext();
  const confidence = hasData ? Math.round(result.confidence * 100) : 0;
  const contributors = metricContributors(result, context);
  const focusLabel = hasData ? supportiveScoreLabel('focus', result.focus_score) : 'No baseline';

  elements.focusRing.style.setProperty('--score', result.focus_score);
  elements.focusScore.textContent = result.focus_score;
  elements.focusLabel.className = `state-chip ${hasData && result.focus_score < 45 ? 'warning' : 'neutral'}`;
  elements.focusLabel.textContent = focusLabel;
  elements.scoreHeadline.textContent = hasData
    ? result.focus_score >= 70
      ? 'Your attention has a strong foundation today.'
      : result.focus_score >= 45
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
    ? 'Focus Potential estimates how well today\'s behavior supported sustained attention.'
    : 'Add a snapshot to explain your focus potential.';
  elements.focusConfidence.textContent = `${confidence}%`;
  renderContributorList(elements.focusContributors, hasData ? contributors.focus : []);
  elements.fatigueScore.textContent = result.fatigue_score;
  elements.fatigueLabel.textContent = hasData
    ? supportiveScoreLabel('fatigue', result.fatigue_score)
    : 'Not measured';
  elements.fatigueExplanation.textContent = hasData
    ? 'Mental Fatigue estimates cognitive load from screen volume, timing, and recovery.'
    : 'Add a snapshot to reveal fatigue contributors.';
  elements.fatigueConfidence.textContent = `${confidence}%`;
  renderContributorList(elements.fatigueContributors, hasData ? contributors.fatigue : []);
  elements.distractionScore.textContent = result.distraction_score;
  elements.distractionLabel.textContent = hasData
    ? supportiveScoreLabel('distraction', result.distraction_score)
    : 'Not measured';
  elements.distractionExplanation.textContent = hasData
    ? 'Distraction Load estimates attention fragmentation from app mix and switching behavior.'
    : 'Add a snapshot to reveal distraction contributors.';
  elements.distractionConfidence.textContent = `${confidence}%`;
  renderContributorList(elements.distractionContributors, hasData ? contributors.distraction : []);
  elements.burnoutRisk.textContent = result.burnout_risk;
  elements.burnoutScore.textContent = `${result.burnout_score} / 100`;
  elements.burnoutExplanation.textContent = hasData
    ? 'Burnout Tendency combines behavioral load and recovery signals. It is not a diagnosis.'
    : 'Add a snapshot to explain recovery pressure.';
  elements.burnoutConfidence.textContent = `${confidence}%`;
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
  if (alert) {
    elements.alertSeverity.textContent = alert.severity;
    elements.alertTitle.textContent = alert.title;
    elements.alertMessage.textContent = alert.message;
    elements.alertReason.textContent = alert.reason;
  }

  const recommendation = result.recommendations?.[0];
  elements.recommendationTitle.textContent = hasData ? 'One useful move for tomorrow' : 'Create your first baseline';
  elements.recommendationText.textContent = recommendation
    || 'Enter today\'s app usage and optional behavior signals to get a focused intervention.';

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
  const entry = {
    date: localDateKey(),
    focus_score: prediction.focus_score,
    fatigue_score: prediction.fatigue_score,
    distraction_score: prediction.distraction_score,
    burnout_score: prediction.burnout_score,
    burnout_risk: prediction.burnout_risk,
    productive_ratio: prediction.productive_ratio,
    total_minutes: prediction.total_minutes,
    context,
  };
  history = history.filter(item => item.date !== entry.date);
  history.push(entry);
  history.sort((a, b) => a.date.localeCompare(b.date));
  history = history.slice(-30);
}

function lastSevenDays() {
  const byDate = new Map(history.map(entry => [entry.date, entry]));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return {
      date: key,
      label: date.toLocaleDateString(APP_LOCALE, { month: 'numeric', day: 'numeric' }),
      entry: byDate.get(key) || null,
    };
  });
}

function renderTrends() {
  const days = lastSevenDays();
  const available = days.filter(day => day.entry);
  const coverageLabel = `${available.length} recorded ${available.length === 1 ? 'day' : 'days'}`;

  elements.trendChart.innerHTML = days.map(day => {
    if (!day.entry) {
      return `
        <div class="trend-day missing" title="${day.date}: no snapshot recorded">
          <div class="trend-bars">
            <div class="trend-placeholder" aria-label="No snapshot recorded"></div>
          </div>
          <span class="trend-day-label">${day.label}</span>
        </div>
      `;
    }

    const focus = day.entry.focus_score || 0;
    const fatigue = day.entry.fatigue_score || 0;
    return `
      <div class="trend-day recorded" title="${day.date}: focus ${focus}, fatigue ${fatigue}">
        <div class="trend-bars">
          <div class="trend-bar focus" style="--value: ${focus}"></div>
          <div class="trend-bar fatigue" style="--value: ${fatigue}"></div>
        </div>
        <span class="trend-day-label">${day.label}</span>
      </div>
    `;
  }).join('');
  elements.trendChart.setAttribute(
    'aria-label',
    `Seven-day focus score chart. ${coverageLabel}.`,
  );
  const showTrendOnboarding = available.length < 2;
  elements.trendEmptyState.classList.toggle('hidden', !showTrendOnboarding);
  elements.trendChart.classList.toggle('hidden', showTrendOnboarding);
  elements.trendChartLegend.classList.toggle('hidden', showTrendOnboarding);
  elements.averageFocusDetail.textContent = coverageLabel;
  elements.averageFatigueDetail.textContent = coverageLabel;

  if (!available.length) {
    elements.averageFocus.textContent = '0';
    elements.averageFatigue.textContent = '0';
    elements.bestDay.textContent = '--';
    elements.trendRisk.textContent = 'Low';
    elements.trendDirection.className = 'state-chip neutral';
    elements.trendDirection.textContent = '0/7 days';
    elements.trendNote.textContent =
      'Add snapshots on multiple days to uncover your personal focus and fatigue pattern.';
    return;
  }

  const averageFocus = Math.round(
    available.reduce((sum, day) => sum + day.entry.focus_score, 0) / available.length,
  );
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
    ? '1/7 days'
    : change > 5
      ? `Up ${change}`
      : change < -5
        ? `Down ${Math.abs(change)}`
        : 'Stable';
  elements.trendNote.textContent = available.length === 1
    ? 'Only one day is recorded. Generate one snapshot each day to build the seven-day trend.'
    : available.length < 3
      ? 'A few more daily snapshots will make your personal baseline more reliable.'
    : change > 5
      ? 'Focus is improving across the available week. Protect the routines behind your strongest day.'
      : change < -5
        ? 'Focus has softened across the available week. Check late-night use and app switching first.'
        : 'Your focus has been relatively stable. Small changes in recovery may produce the next gain.';
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

function buildLocalMentorResponse(question, prediction) {
  const normalized = question.toLowerCase();
  const dominant = dominantUsage(prediction);
  const category = CATEGORY_LABELS[dominant.category] || 'your dominant app category';
  const evidence = prediction.insights?.slice(0, 2) || [];
  const recommendations = prediction.recommendations || [];
  const focusStep = recommendations.find(item => (
    /focus|deep-work|learning|priority work/i.test(item)
  )) || recommendations[0];
  const recoveryStep = recommendations.find(item => (
    /walk|recovery|screen-free|earlier|bed/i.test(item)
  )) || recommendations[0];
  const nextStep = recommendations[0]
    || 'Protect one short, interruption-free focus block tomorrow.';
  let answer;

  if (normalized.includes('distract') || normalized.includes('focus') || normalized.includes('switch')) {
    answer = `${category} took the largest share of your attention at ${dominant.percentage}%. ${
      currentContext.deep_work_minutes >= 25
        ? `Your ${currentContext.deep_work_minutes}-minute deep-work block helped offset some of that pressure.`
        : 'Without a protected deep-work block, your attention had fewer chances to settle.'
    } ${focusStep || nextStep}`;
  } else if (normalized.includes('tired') || normalized.includes('fatigue') || normalized.includes('sleep')) {
    answer = `Today's energy pressure came mostly from ${formatMinutes(prediction.total_minutes)} of screen load${
      currentContext.late_night_minutes
        ? ` and ${currentContext.late_night_minutes} late-night minutes`
        : ''
    }. You do not need to overhaul the whole day: ${recoveryStep || nextStep}`;
  } else if (normalized.includes('burnout') || normalized.includes('stress') || normalized.includes('overload')) {
    answer = `Your current pattern suggests ${prediction.burnout_risk} behavioral overload pressure. The useful signal is not the label itself; it is whether screen load is being balanced by recovery. ${recoveryStep || nextStep}`;
  } else {
    answer = `${buildSnapshotInsight(prediction, currentContext)} The highest-leverage next move is simple: ${nextStep}`;
  }

  return {
    answer,
    evidence,
    next_steps: prediction.recommendations?.slice(0, 2) || [],
  };
}

async function requestMentorResponse(question) {
  const prediction = currentPrediction || predictLocally(currentContext);
  try {
    const response = await fetchWithTimeout(`${API_BASE}/chat`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ question, context: currentContext }),
    }, 2200);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return await response.json();
  } catch {
    return buildLocalMentorResponse(question, prediction);
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
  const detail = [
    evidence ? `Evidence: ${evidence}` : '',
    nextStep ? `Next step: ${nextStep}` : '',
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
    key: 'lien quan',
    name: 'Lien Quan Mobile',
    category: 'games',
    patterns: [/\bli.?n\s+qu.?n\b/, /\blien\s*quan\b/],
  },
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
  const match = OCR_APP_KEYWORDS.find(({ keyword }) => normalized.includes(keyword));
  if (!match) return null;
  return {
    key: match.keyword,
    name: titleCase(match.keyword),
    category: match.category,
  };
}

function parseDuration(text) {
  const normalized = normalizeText(text);
  const hoursAndMinutes = normalized.match(
    /(\d{1,2})\s*(?:h|hr|hrs|hour|hours|g|gio)\s*(\d{1,2})\s*(?:m|min|mins|minute|minutes|ph|phut)/,
  );
  if (hoursAndMinutes) return Number(hoursAndMinutes[1]) * 60 + Number(hoursAndMinutes[2]);
  const hours = normalized.match(/(\d{1,2})\s*(?:h|hr|hrs|hour|hours|g|gio)/);
  if (hours) return Number(hours[1]) * 60;
  const minutes = normalized.match(
    /(\d{1,3})\s*(?:m|min|mins|minute|minutes|ph|phut)/,
  );
  return minutes ? Number(minutes[1]) : null;
}

function extractPrimaryScreenTime(rowLines) {
  const joined = normalizeText(rowLines.join(' '));
  const durationPattern = [
    '\\d{1,2}\\s*(?:h|hr|hrs|hour|hours|g|gio)',
    '(?:\\s*\\d{1,2}\\s*(?:m|min|mins|minute|minutes|ph|phut))?',
    '|\\d{1,3}\\s*(?:m|min|mins|minute|minutes|ph|phut)',
  ].join('');
  const primaryPattern = new RegExp(
    [
      '(?:on\\s*screen|screen\\s*on|screen\\s*time',
      '|man\\s*hinh(?:\\s*b.?t)?|b.?t\\s*man\\s*hinh',
      '|thoi\\s*gian\\s*man\\s*hinh)',
      '\\s*(?:for\\s*)?(?:time\\s*)?[:\\-]?\\s*',
      `(${durationPattern})`,
    ].join(''),
  );
  const primary = joined.match(primaryPattern);
  if (primary) {
    const minutes = parseDuration(primary[1]);
    if (minutes !== null && minutes <= 1440) return { minutes, confidence: 2 };
  }

  const fallbackLine = rowLines.find(line => {
    const normalized = normalizeText(line);
    return parseDuration(normalized) !== null
      && !/(?:background|average|compared|last week|longer|less|battery|charging|chay nen|nen)/.test(normalized)
      && !/%/.test(normalized);
  });
  const minutes = fallbackLine ? parseDuration(fallbackLine) : null;
  return minutes !== null && minutes <= 1440
    ? { minutes, confidence: 1 }
    : null;
}

function extractTextLines(detections) {
  return detections
    .filter(item => item.rawValue?.trim())
    .sort((a, b) => {
      const left = a.boundingBox || { x: 0, y: 0 };
      const right = b.boundingBox || { x: 0, y: 0 };
      return (left.y - right.y) || (left.x - right.x);
    })
    .flatMap(item => item.rawValue.split(/\r?\n/))
    .map(line => line.trim())
    .filter(Boolean);
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
  if ('TextDetector' in globalThis) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const detections = await new TextDetector().detect(bitmap);
      const lines = extractTextLines(detections);
      if (lines.length) return lines;
    } catch {
      // Fall through to the bundled OCR engine when the experimental API fails.
    } finally {
      bitmap?.close?.();
    }
  }

  const worker = await getOcrWorker();
  const result = await worker.recognize(file);
  return (result.data?.text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function parseDetectedUsage(lines) {
  const usage = emptyUsage();
  const rows = [];
  let currentRow = null;

  lines.forEach(line => {
    const app = inferOcrApp(line);
    if (app) {
      if (currentRow) rows.push(currentRow);
      currentRow = { ...app, lines: [line] };
      return;
    }
    if (currentRow && currentRow.lines.length < 5) currentRow.lines.push(line);
  });
  if (currentRow) rows.push(currentRow);

  const bestByApp = new Map();
  rows.forEach(row => {
    const duration = extractPrimaryScreenTime(row.lines);
    if (!duration) return;
    const existing = bestByApp.get(row.key);
    if (!existing || duration.confidence > existing.confidence) {
      bestByApp.set(row.key, { ...row, ...duration });
    }
  });

  const matches = [...bestByApp.values()];
  matches.forEach(match => {
    usage[match.category] += match.minutes;
  });
  return { usage, matches };
}

function showScreenshotPreview(file) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  elements.screenshotPreview.src = previewUrl;
  elements.screenshotPreview.classList.remove('hidden');
}

function setOcrStatus(message, tone = '') {
  elements.ocrStatus.textContent = message;
  elements.ocrStatus.className = `import-status ${tone}`.trim();
}

async function processScreenshot(file) {
  if (!file?.type.startsWith('image/')) {
    setOcrStatus('The selected clipboard item is not an image.', 'error');
    return;
  }

  showScreenshotPreview(file);
  elements.ocrMatches.classList.add('hidden');
  elements.ocrMatches.innerHTML = '';

  setOcrStatus('Scanning the screenshot locally...', 'processing');

  try {
    const lines = await recognizeScreenshot(file);
    const { usage, matches } = parseDetectedUsage(lines);

    if (!matches.length) {
      setOcrStatus('No recognizable app-and-time rows were found. Enter the totals manually.', 'error');
      return;
    }

    CATEGORIES.forEach(category => {
      document.getElementById(category).value = usage[category];
    });
    elements.ocrMatches.innerHTML = matches.slice(0, 10).map(match => (
      `<span class="ocr-match">${escapeHtml(match.name)} ${formatMinutes(match.minutes)}</span>`
    )).join('');
    elements.ocrMatches.classList.remove('hidden');
    setOcrStatus(
      `Detected ${matches.length} apps using each app's On screen time. Review the totals before analyzing.`,
      'success',
    );
  } catch (error) {
    console.error('Screenshot OCR failed:', error);
    setOcrStatus('The screenshot could not be read. Try a sharper crop with app names and times.', 'error');
  }
}

async function handleAnalysisSubmit(event) {
  event.preventDefault();
  await rolloverWorkspaceDay();
  currentContext = collectContext();
  const total = Object.values(currentContext.usage).reduce((sum, value) => sum + value, 0);

  if (!total) {
    elements.analysisStatus.textContent = 'Add at least one usage value before analyzing.';
    elements.analysisStatus.className = 'form-status error';
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
    await storageSet({
      [STORAGE_KEYS.context]: currentContext,
      [STORAGE_KEYS.prediction]: currentPrediction,
      [STORAGE_KEYS.snapshotDate]: workspaceDate,
      [STORAGE_KEYS.history]: history,
    });
    if (appMode === 'account') {
      renderReminderSettings('Today is complete. The email reminder will be skipped.');
    }
    renderOverview(currentPrediction);
    renderTrends();
    void syncUsageToAccount(currentContext.usage);
    switchScreen('overview');
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
    elements.accountPanel.classList.toggle('hidden');
  });
  elements.closeAccount?.addEventListener('click', () => elements.accountPanel.classList.add('hidden'));
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

async function initialize() {
  bindEvents();
  setAuthMode('login');
  const stored = await storageGet(Object.values(STORAGE_KEYS));

  history = Array.isArray(stored[STORAGE_KEYS.history]) ? stored[STORAGE_KEYS.history] : [];
  const today = localDateKey();
  const snapshotDate = stored[STORAGE_KEYS.snapshotDate] || latestHistoryDate(history);
  const hasStoredSnapshot = Boolean(
    stored[STORAGE_KEYS.context] || stored[STORAGE_KEYS.prediction],
  );
  const hasTodaySnapshot = snapshotDate === today;
  const rolledOver = hasStoredSnapshot && !hasTodaySnapshot;

  workspaceDate = today;
  currentContext = hasTodaySnapshot
    ? stored[STORAGE_KEYS.context] || emptyContext()
    : emptyContext();
  currentPrediction = hasTodaySnapshot
    ? stored[STORAGE_KEYS.prediction] || null
    : null;
  chatHistory = Array.isArray(stored[STORAGE_KEYS.chat]) ? stored[STORAGE_KEYS.chat] : [];
  accountDeviceId = stored[STORAGE_KEYS.devicePlatform] === clientPlatform()
    ? stored[STORAGE_KEYS.deviceId] || null
    : null;

  populateContext(currentContext);
  renderOverview(currentPrediction);
  renderTrends();
  renderReminderSettings();
  if (rolledOver) {
    await storageRemove([
      STORAGE_KEYS.context,
      STORAGE_KEYS.prediction,
      STORAGE_KEYS.snapshotDate,
    ]);
    showNewDayStatus();
  } else if (hasTodaySnapshot && !stored[STORAGE_KEYS.snapshotDate]) {
    await storageSet({ [STORAGE_KEYS.snapshotDate]: today });
  }

  chatHistory.slice(-8).forEach(message => {
    addChatMessage(message.role, message.text, message.detail || '');
  });

  const storedToken = stored[STORAGE_KEYS.authToken];
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
