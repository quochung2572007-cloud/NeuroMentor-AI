'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Core = require('../core.js');

const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'scoring_cases.json'), 'utf8'),
);

function test(name, callback) {
  try {
    callback();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

test('normalization does not mutate input and clamps negative values', () => {
  const input = { social: -10, productivity: '20.4' };
  const normalized = Core.normalizeUsage(input);
  assert.deepStrictEqual(normalized, {
    social: 0,
    productivity: 20,
    games: 0,
    learning: 0,
    health: 0,
    entertainment: 0,
  });
  assert.strictEqual(input.social, -10);
});

test('validation rejects a reported-total mismatch', () => {
  const validation = Core.validateContext({
    usage: { social: 60, entertainment: 30 },
    reported_total_minutes: 120,
  });
  assert.strictEqual(validation.valid, false);
  assert.match(validation.errors[0], /add up to 90 minutes/i);
});

test('shared score bands use the same product guidance thresholds', () => {
  assert.strictEqual(Core.scoreBand('focus', 34).key, 'needs-attention');
  assert.strictEqual(Core.scoreBand('focus', 35).key, 'building');
  assert.strictEqual(Core.scoreBand('focus', 55).key, 'steady');
  assert.strictEqual(Core.scoreBand('focus', 75).key, 'strong');

  assert.strictEqual(Core.scoreBand('fatigue', 44).key, 'moderate');
  assert.strictEqual(Core.scoreBand('fatigue', 45).key, 'watch');
  assert.strictEqual(Core.scoreBand('fatigue', 70).key, 'high');

  assert.strictEqual(Core.scoreBand('distraction', 44).key, 'moderate');
  assert.strictEqual(Core.scoreBand('distraction', 45).key, 'watch');
  assert.strictEqual(Core.scoreBand('distraction', 70).key, 'high');

  assert.strictEqual(Core.scoreBand('burnout', 49).key, 'moderate');
  assert.strictEqual(Core.scoreBand('burnout', 50).key, 'elevated');
  assert.strictEqual(Core.scoreBand('burnout', 75).key, 'high');
});

test('score alerts require enough context before showing a behavioral warning', () => {
  const incomplete = Core.calculatePrediction({ usage: { games: 600 } });
  assert.strictEqual(incomplete.alerts.length, 1);
  assert.strictEqual(incomplete.alerts[0].alert_type, 'context_quality');
  assert.strictEqual(incomplete.alerts[0].severity, 'info');

  const complete = Core.calculatePrediction({
    usage: { games: 600 },
    app_switches: 50,
    late_night_minutes: 60,
    deep_work_minutes: 25,
    app_launches: 20,
  });
  assert.strictEqual(complete.alerts.length, 1);
  assert.strictEqual(complete.alerts[0].alert_type, 'focus_signal');
  assert.strictEqual(complete.alerts[0].severity, 'high');
  assert.ok(complete.alerts[0].action);

  const supported = Core.calculatePrediction({
    usage: { productivity: 120 },
    app_switches: 5,
    deep_work_minutes: 30,
  });
  assert.deepStrictEqual(supported.alerts, []);
});

test('unknown OCR app names remain available for user classification', () => {
  assert.strictEqual(Core.extractAppNameCandidate('WorkZone.io 3%'), 'WorkZone.io');
  assert.strictEqual(Core.extractAppNameCandidate('Ariana'), 'Ariana');
  assert.strictEqual(Core.extractAppNameCandidate('Unknown App 1h 20m'), 'Unknown App');
  assert.strictEqual(Core.extractAppNameCandidate('Battery Usage'), null);
  assert.strictEqual(Core.extractAppNameCandidate('Ứng dụng'), null);
  assert.strictEqual(Core.extractAppNameCandidate('Tuần này'), null);
  assert.strictEqual(Core.extractAppNameCandidate('Dùng nhiều nhất'), null);
  assert.strictEqual(Core.extractAppNameCandidate('2g 9ph'), null);
  assert.strictEqual(Core.extractAppNameCandidate('(z= Background activity for'), null);
  assert.strictEqual(Core.extractAppNameCandidate('Other Battery Usage'), null);
});

test('Vietnamese screen-time durations are converted to minutes', () => {
  assert.strictEqual(Core.parseScreenDuration('2g 9ph'), 129);
  assert.strictEqual(Core.parseScreenDuration('1g 46ph'), 106);
  assert.strictEqual(Core.parseScreenDuration('51ph'), 51);
  assert.strictEqual(Core.parseScreenDuration('24 phút'), 24);
});

test('battery percentages are rejected as screen-time durations', () => {
  const detection = Core.classifyUsageScreenshot([
    { text: 'Mức sử dụng pin' },
    { text: 'Hôm nay' },
    { text: 'YouTube' },
    { text: '38,81%' },
    { text: 'Instagram' },
    { text: '20,03%' },
    { text: 'TikTok' },
    { text: '18,68%' },
  ]);
  assert.strictEqual(detection.kind, 'battery-percentages');
  assert.strictEqual(detection.duration_count, 0);
  assert.strictEqual(detection.percentage_count, 3);
});

test('screenshots with app durations remain valid for OCR extraction', () => {
  const detection = Core.classifyUsageScreenshot([
    { text: 'Battery Usage' },
    { text: 'Messenger' },
    { text: '2h 16m on screen' },
    { text: 'Facebook' },
    { text: '35m on screen' },
  ]);
  assert.strictEqual(detection.kind, 'screen-time');
  assert.strictEqual(detection.duration_count, 2);
});

test('OCR rows pair app names with nearby usage times and ignore interface headings', () => {
  const matches = Core.pairOcrUsageRows([
    { text: 'Tuần này', x: 300, y: 100, height: 34, confidence: 95 },
    { text: 'Dùng nhiều nhất', x: 70, y: 180, height: 28, confidence: 92 },
    { text: 'Hiển thị danh mục', x: 500, y: 180, height: 28, confidence: 90 },
    { text: 'Liên Quân Mobile', x: 180, y: 250, height: 38, confidence: 96 },
    { text: '2g 9ph', x: 670, y: 294, height: 24, confidence: 84 },
    { text: 'TikTok', x: 180, y: 370, height: 38, confidence: 97 },
    { text: '1g 46ph', x: 670, y: 414, height: 24, confidence: 86 },
    { text: 'Block Blast!', x: 180, y: 490, height: 38, confidence: 95 },
    { text: '51ph', x: 390, y: 534, height: 24, confidence: 80 },
    { text: 'Messenger', x: 180, y: 610, height: 38, confidence: 98 },
    { text: '24ph', x: 290, y: 654, height: 24, confidence: 82 },
  ]);
  assert.deepStrictEqual(
    matches.map(match => [match.name, match.minutes]),
    [
      ['Liên Quân Mobile', 129],
      ['TikTok', 106],
      ['Block Blast!', 51],
      ['Messenger', 24],
    ],
  );
});

test('background activity is not emitted as an OCR app row', () => {
  const matches = Core.pairOcrUsageRows([
    { text: 'TikTok', y: 100, height: 28, confidence: 94 },
    { text: '15m on screen', y: 134, height: 18, confidence: 90 },
    { text: '(z= Background activity for', y: 158, height: 18, confidence: 84 },
    { text: '17m', y: 180, height: 18, confidence: 88 },
    { text: 'Messenger', y: 230, height: 28, confidence: 96 },
    { text: '9m on screen', y: 264, height: 18, confidence: 91 },
  ]);
  assert.deepStrictEqual(
    matches.map(match => [match.name, match.minutes]),
    [['TikTok', 15], ['Messenger', 9]],
  );
});

test('OCR fragments and icon artifacts are not emitted as apps', () => {
  const matches = Core.pairOcrUsageRows([
    { text: 'enesss', y: 100, height: 18, confidence: 88 },
    { text: '24m', y: 126, height: 18, confidence: 90 },
    { text: 'Tài liệu', y: 190, height: 26, confidence: 82 },
    { text: 'esse', y: 195, height: 16, confidence: 86 },
    { text: '23m', y: 224, height: 18, confidence: 91 },
    { text: 'Almanac', y: 290, height: 26, confidence: 84 },
    { text: 'w ==', y: 294, height: 16, confidence: 80 },
    { text: '10m', y: 324, height: 18, confidence: 90 },
  ]);
  assert.deepStrictEqual(
    matches.map(match => [match.name, match.minutes]),
    [['Tài liệu', 23], ['Almanac', 10]],
  );
});

test('unidentified OCR garbage is not shown for user classification', () => {
  const matches = Core.pairOcrUsageRows([
    { text: 'w ae»', y: 100, height: 18, confidence: 86 },
    { text: '10m', y: 126, height: 18, confidence: 90 },
    { text: 'sap OTAD 5', y: 190, height: 18, confidence: 88 },
    { text: '3m', y: 216, height: 18, confidence: 92 },
    { text: 'NTH oe', y: 280, height: 18, confidence: 89 },
    { text: '2m', y: 306, height: 18, confidence: 91 },
  ]);
  assert.deepStrictEqual(matches, []);
});

test('unclassified and ignored extraction rows are preserved for review', () => {
  const snapshot = Core.createDailySnapshot({
    context: fixtures[0].context,
    extraction: {
      status: 'ready',
      items: [
        { app: 'Ariana', category: '', minutes: 0, confidence: 0.24 },
        { app: 'System UI', category: 'ignore', minutes: 0, confidence: 0.2 },
      ],
    },
  });
  assert.strictEqual(snapshot.extraction.items[0].category, '');
  assert.strictEqual(snapshot.extraction.items[1].category, 'ignore');
});

fixtures.forEach(fixture => {
  test(`calculation fixture: ${fixture.name}`, () => {
    const result = Core.calculatePrediction(fixture.context);
    const expected = fixture.expected;
    assert.strictEqual(result.focus_score, expected.focus_score);
    assert.strictEqual(result.fatigue_score, expected.fatigue_score);
    assert.strictEqual(result.distraction_score, expected.distraction_score);
    assert.strictEqual(result.burnout_score, expected.burnout_score);
    assert.strictEqual(result.confidence, expected.confidence_percent);
    assert.strictEqual(result.total_minutes, expected.total_minutes);
  });
});

test('focus responds to category mix and total screen load', () => {
  const social = Core.calculatePrediction({ usage: { social: 120 } }).focus_score;
  const games = Core.calculatePrediction({ usage: { games: 120 } }).focus_score;
  const entertainment = Core.calculatePrediction({ usage: { entertainment: 120 } }).focus_score;
  const longGaming = Core.calculatePrediction({ usage: { games: 600 } }).focus_score;
  assert.deepStrictEqual([social, games, entertainment], [39, 31, 37]);
  assert.strictEqual(new Set([social, games, entertainment]).size, 3);
  assert.ok(longGaming < games, `${longGaming} should be lower than ${games}`);
});

test('stale API scores cannot override the current snapshot calculation', () => {
  const result = Core.canonicalizePrediction(
    { focus_score: 15, source: 'cloud' },
    { usage: { games: 120 } },
  );
  assert.strictEqual(result.focus_score, 31);
  assert.strictEqual(result.source, 'cloud');
});

test('daily snapshot keeps context and result consistent', () => {
  const snapshot = Core.createDailySnapshot({
    date: '2026-06-20',
    context: fixtures[0].context,
  });
  assert.strictEqual(snapshot.result.total_minutes, Core.totalMinutes(snapshot.context.usage));
  assert.strictEqual(snapshot.result.social_ratio, 120 / 270);
  assert.strictEqual(snapshot.validation.valid, true);
});

test('trend logic keeps missing days empty instead of inventing zero scores', () => {
  const snapshot = Core.createDailySnapshot({
    date: '2026-06-20',
    context: fixtures[0].context,
  });
  const trend = Core.buildTrend([snapshot], '2026-06-20');
  assert.strictEqual(trend.available_days, 1);
  assert.strictEqual(trend.slots.filter(slot => slot.missing).length, 6);
  assert.strictEqual(trend.slots[0].focus, null);

  const thirtyDayTrend = Core.buildTrend([snapshot], '2026-06-20', 30);
  assert.strictEqual(thirtyDayTrend.slots.length, 30);
  assert.strictEqual(thirtyDayTrend.available_days, 1);
  assert.strictEqual(thirtyDayTrend.slots.filter(slot => slot.missing).length, 29);
  assert.strictEqual(thirtyDayTrend.slots.at(-1).focus, snapshot.result.focus_score);
});

test('same-day analysis replaces the trend value with the latest snapshot', () => {
  const older = Core.createDailySnapshot({
    date: '2026-06-20',
    context: fixtures[0].context,
    updatedAt: '2026-06-20T12:00:00.000Z',
  });
  const newer = Core.createDailySnapshot({
    date: '2026-06-20',
    context: fixtures[1].context,
    updatedAt: '2026-06-20T18:00:00.000Z',
  });
  const snapshots = Core.upsertSnapshot([older], newer);
  const today = Core.buildTrend(snapshots, '2026-06-20').slots.at(-1);
  assert.strictEqual(snapshots.length, 1);
  assert.strictEqual(today.focus, newer.result.focus_score);
  assert.strictEqual(today.fatigue, newer.result.fatigue_score);
});

test('Mentor intents produce distinct, safe deterministic responses', () => {
  const snapshot = Core.createDailySnapshot({ date: '2026-06-20', context: fixtures[0].context });
  const questions = [
    'How might I feel?',
    'What should I do?',
    'Why did my focus change?',
    'Plan tomorrow',
  ];
  const responses = questions.map(question => Core.buildMentorResponse(question, snapshot, [snapshot]));
  assert.strictEqual(new Set(responses.map(response => response.intent)).size, 4);
  assert.strictEqual(new Set(responses.map(response => response.answer)).size, 4);
  assert.match(responses[0].answer, /cannot determine how you feel/i);
  responses.forEach(response => {
    assert.doesNotMatch(response.answer, /you have (adhd|depression|burnout)/i);
  });
});

test('Mentor detects Vietnamese and answers in Vietnamese', () => {
  const snapshot = Core.createDailySnapshot({ date: '2026-06-20', context: fixtures[0].context });
  const questions = [
    ['Tôi có thể cảm thấy thế nào?', 'feel'],
    ['Tôi nên làm gì?', 'action'],
    ['Tại sao điểm tập trung thay đổi?', 'explain'],
    ['Lập kế hoạch ngày mai', 'plan'],
  ];
  questions.forEach(([question, intent]) => {
    const response = Core.buildMentorResponse(question, snapshot, [snapshot]);
    assert.strictEqual(response.language, 'vi');
    assert.strictEqual(response.intent, intent);
    assert.doesNotMatch(response.answer, /Screen-time metadata/i);
  });
  assert.strictEqual(Core.detectMentorLanguage('Toi nen lam gi?'), 'vi');
});

test('Mentor handles basic conversation without repeating the default report', () => {
  const snapshot = Core.createDailySnapshot({ date: '2026-06-20', context: fixtures[0].context });
  const acknowledgement = Core.buildMentorResponse('oke', snapshot, [snapshot]);
  assert.strictEqual(acknowledgement.language, 'vi');
  assert.strictEqual(acknowledgement.intent, 'acknowledge');
  assert.strictEqual(acknowledgement.evidence, '');
  assert.strictEqual(acknowledgement.action, '');
  assert.doesNotMatch(acknowledgement.answer, /ước tính tập trung|focus estimate/i);

  const reduction = Core.buildMentorResponse(
    'Tôi có nên giảm bớt thời gian sử dụng không?',
    snapshot,
    [snapshot],
  );
  assert.strictEqual(reduction.intent, 'screen_time');
  assert.match(reduction.answer, /giảm khoảng|không cần cắt giảm mạnh/i);
  assert.doesNotMatch(reduction.answer, /mình chưa hiểu rõ/i);

  const unknown = Core.buildMentorResponse('Câu này hơi khác một chút', snapshot, [snapshot]);
  assert.strictEqual(unknown.intent, 'general');
  assert.match(unknown.answer, /chưa hiểu rõ/i);
});

test('Mentor summarizes the latest daily snapshot in English and Vietnamese', () => {
  const snapshot = Core.createDailySnapshot({ date: '2026-06-20', context: fixtures[0].context });
  const englishQuestions = [
    'Analyze today',
    'Can you summarize the analyze me today?',
    "Give me today's summary",
  ];
  englishQuestions.forEach(question => {
    const response = Core.buildMentorResponse(question, snapshot, [snapshot]);
    assert.strictEqual(response.intent, 'daily_summary');
    assert.strictEqual(response.language, 'en');
    assert.match(response.answer, /today's summary/i);
    assert.match(response.answer, new RegExp(`focus ${snapshot.result.focus_score}\\/100`, 'i'));
    assert.match(response.answer, /priority action/i);
  });

  const vietnameseQuestions = ['Tóm tắt hôm nay', 'Tom tat ngay hom nay'];
  vietnameseQuestions.forEach(question => {
    const response = Core.buildMentorResponse(question, snapshot, [snapshot]);
    assert.strictEqual(response.intent, 'daily_summary');
    assert.strictEqual(response.language, 'vi');
    assert.match(response.answer, /Tóm tắt hôm nay/i);
    assert.match(response.answer, /Hành động ưu tiên/i);
  });
});
