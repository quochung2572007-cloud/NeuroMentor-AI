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
