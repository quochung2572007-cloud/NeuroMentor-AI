(function bootstrapNeuroMentorCore(root, factory) {
  const core = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }

  root.NeuroMentorCore = core;
})(typeof globalThis !== "undefined" ? globalThis : this, function createNeuroMentorCore() {
  "use strict";

  const SCHEMA_VERSION = 1;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const CATEGORIES = Object.freeze([
    "social",
    "productivity",
    "games",
    "learning",
    "health",
    "entertainment",
  ]);
  const CATEGORY_LABELS = Object.freeze({
    social: "Social",
    productivity: "Productivity",
    games: "Games",
    learning: "Learning",
    health: "Health",
    entertainment: "Entertainment",
  });
  const CATEGORY_LABELS_VI = Object.freeze({
    social: "Mạng xã hội",
    productivity: "Công việc",
    games: "Trò chơi",
    learning: "Học tập",
    health: "Sức khỏe",
    entertainment: "Giải trí",
  });

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function wholeMinutes(value) {
    return Math.max(0, Math.round(finiteNumber(value)));
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeUsage(usage = {}) {
    return CATEGORIES.reduce((normalized, category) => {
      normalized[category] = wholeMinutes(usage[category]);
      return normalized;
    }, {});
  }

  function normalizeContext(context = {}) {
    const reportedTotal = context.reported_total_minutes;
    const appLaunches = context.app_launches ?? context.launch_count;

    return {
      usage: normalizeUsage(context.usage),
      app_switches: wholeMinutes(context.app_switches),
      late_night_minutes: wholeMinutes(context.late_night_minutes),
      deep_work_minutes: wholeMinutes(context.deep_work_minutes),
      app_launches: wholeMinutes(appLaunches),
      launch_count: wholeMinutes(appLaunches),
      reported_total_minutes:
        reportedTotal === "" || reportedTotal === null || reportedTotal === undefined
          ? null
          : wholeMinutes(reportedTotal),
    };
  }

  function totalMinutes(usage = {}) {
    const normalized = normalizeUsage(usage);
    return CATEGORIES.reduce((total, category) => total + normalized[category], 0);
  }

  function normalizeSearchText(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseScreenDuration(value = "") {
    const normalized = normalizeSearchText(value).replace(/[’′]/g, "'");
    const hourUnit = "(?:h|hr|hrs|hour|hours|g|gio|tieng)";
    const minuteUnit = "(?:m|min|mins|minute|minutes|p|ph|phut|')";
    const hoursAndMinutes = normalized.match(
      new RegExp(`(\\d{1,2})\\s*${hourUnit}\\s*(\\d{1,2})\\s*${minuteUnit}`),
    );
    if (hoursAndMinutes) {
      return Number(hoursAndMinutes[1]) * 60 + Number(hoursAndMinutes[2]);
    }
    const compactHoursAndMinutes = normalized.match(
      new RegExp(`(\\d{1,2})\\s*${hourUnit}\\s*(\\d{1,2})(?!\\s*%)`),
    );
    if (compactHoursAndMinutes) {
      return Number(compactHoursAndMinutes[1]) * 60 + Number(compactHoursAndMinutes[2]);
    }
    const hours = normalized.match(new RegExp(`(\\d{1,2})\\s*${hourUnit}`));
    if (hours) return Number(hours[1]) * 60;
    const minutes = normalized.match(new RegExp(`(\\d{1,3})\\s*${minuteUnit}`));
    return minutes ? Number(minutes[1]) : null;
  }

  function extractAppNameCandidate(value = "") {
    const source = String(value).replace(/\s+/g, " ").trim();
    if (!source || source.length < 3 || source.length > 52 || source.includes(":")) return null;
    if (
      parseScreenDuration(source) !== null &&
      /^[=_•·\-–—>\s]*\d{1,3}\s*(?:h|hr|hrs|hour|hours|g|giờ|gio|tiếng|tieng|m|min|mins|minute|minutes|p|ph|phút|phut)/iu.test(source)
    ) {
      return null;
    }
    const cleaned = source
      .replace(/\s+\d{1,2}\s*(?:h|hr|hrs|hour|hours|g|giờ|gio|tiếng|tieng)(?:\s*\d{1,2}\s*(?:m|min|mins|minute|minutes|p|ph|phút|phut))?.*$/iu, "")
      .replace(/\s+\d{1,3}\s*(?:m|min|mins|minute|minutes|p|ph|phút|phut)\b.*$/iu, "")
      .replace(/\s+[\d.,]+\s*%.*$/i, "")
      .replace(/^[•·\-–—=_>]+\s*/, "")
      .trim();
    if (!cleaned || !/[a-zA-ZÀ-ỹ]/u.test(cleaned) || cleaned.split(/\s+/).length > 6) return null;

    const normalized = normalizeSearchText(cleaned);
    const interfacePhrases = [
      "battery usage", "battery activity", "screen time", "screen on", "on screen", "show activity",
      "daily average", "last week", "last 10 days", "background activity", "total usage",
      "su dung pin", "hoat dong pin", "thoi gian man hinh", "hien thi hoat dong",
      "trung binh hang ngay", "ung dung", "danh muc", "tat ca hoat dong", "tong thoi gian",
      "used for", "da dung", "tuan nay", "dung nhieu nhat", "hien thi danh muc",
      "most used", "most active", "show categories", "week", "this week",
    ];
    if (interfacePhrases.some((phrase) => normalized.includes(phrase))) {
      return null;
    }
    if (/back\s*ground\s+activi(?:ty|fy|ly)|hoat\s+dong\s+(?:nen|ngam)|chay\s+nen/.test(normalized)) {
      return null;
    }
    if (/^(today|yesterday|hom nay|hom qua|minutes?|hours?|gio|phut|settings?|ki)$/i.test(normalized)) {
      return null;
    }
    return cleaned;
  }

  function pairOcrUsageRows(rawItems = []) {
    const items = rawItems
      .map((item, index) => {
        const source = typeof item === "string" ? { text: item } : (item || {});
        const text = String(source.text || source.rawValue || "").replace(/\s+/g, " ").trim();
        const confidenceValue = Number(source.confidence);
        return {
          text,
          x: finiteNumber(source.x ?? source.left, 0),
          y: finiteNumber(source.y ?? source.top, index * 24),
          width: Math.max(0, finiteNumber(source.width, 0)),
          height: Math.max(1, finiteNumber(source.height, 20)),
          confidence: Number.isFinite(confidenceValue)
            ? Math.max(0, Math.min(1, confidenceValue > 1 ? confidenceValue / 100 : confidenceValue))
            : 0.7,
        };
      })
      .filter((item) => item.text)
      .sort((left, right) => (left.y - right.y) || (left.x - right.x));

    const listHeadings = items.filter((item) => {
      const text = normalizeSearchText(item.text);
      return /(?:dung nhieu nhat|hien thi danh muc|most used|most active|app usage)/.test(text);
    });
    const listStart = listHeadings.length
      ? Math.max(...listHeadings.map((item) => item.y + item.height))
      : -Infinity;
    const listItems = items.filter((item) => item.y >= listStart);
    const medianHeight = listItems.length
      ? [...listItems].sort((left, right) => left.height - right.height)[Math.floor(listItems.length / 2)].height
      : 20;
    const maxGap = Math.max(72, medianHeight * 5);
    const matches = [];

    const durationRows = listItems
      .map((item, index) => ({ item, index, minutes: parseScreenDuration(item.text) }))
      .filter((row) => row.minutes !== null && row.minutes > 0 && row.minutes <= 1440);
    let previousDurationY = listStart;

    durationRows.forEach(({ item: timeItem, index: timeIndex, minutes }) => {
      const inlineName = extractAppNameCandidate(timeItem.text);
      const candidates = inlineName
        ? [{ item: timeItem, name: inlineName, gap: 0 }]
        : listItems
            .slice(0, timeIndex)
            .map((item) => ({
              item,
              name: parseScreenDuration(item.text) === null
                ? extractAppNameCandidate(item.text)
                : null,
              gap: timeItem.y - item.y,
            }))
            .filter(({ item, name, gap }) => (
              name && item.y > previousDurationY && gap >= 0 && gap <= maxGap
            ));

      const ranked = candidates
        .map((candidate) => {
          const { item, name, gap } = candidate;
          const letters = name.replace(/[^a-zA-ZÀ-ỹ]/gu, "");
          const words = name.match(/[a-zA-ZÀ-ỹ]+/gu) || [];
          const hasSuspiciousSymbols = /[^a-zA-ZÀ-ỹ0-9 .&+'!_()-]/u.test(name);
          const looksLikeFragment = /^[a-z]{2,8}$/u.test(name);
          const startsLikeFragment = /^[a-zà-ỹ]/u.test(name) && !name.includes(".");
          const hasStandaloneNumber = /(?:^|\s)\d+(?:\s|$)/.test(name);
          const onlyShortWords = words.length > 1 && words.every((word) => word.length <= 3);
          const score = item.confidence * 2
            + Math.min(letters.length / 8, 1)
            + (/^[A-ZÀ-Ỹ]/u.test(name) ? 0.45 : 0)
            - (gap / maxGap) * 0.45
            - (looksLikeFragment ? 2.4 : 0)
            - (startsLikeFragment ? 1.5 : 0)
            - (hasStandaloneNumber ? 2 : 0)
            - (onlyShortWords ? 2 : 0)
            - (hasSuspiciousSymbols ? 3 : 0);
          return { ...candidate, score };
        })
        .filter(({ score }) => score >= 0.8)
        .sort((left, right) => right.score - left.score);

      previousDurationY = Math.max(previousDurationY, timeItem.y);
      if (!ranked.length) return;

      const { item, name } = ranked[0];
      const key = normalizeSearchText(name);
      const candidate = {
        key,
        name,
        minutes,
        confidence: Math.max(0.35, Math.min(item.confidence, timeItem.confidence)),
      };
      const existingIndex = matches.findIndex((match) => match.key === key);
      if (existingIndex < 0) {
        matches.push(candidate);
      } else if (candidate.confidence > matches[existingIndex].confidence) {
        matches[existingIndex] = candidate;
      }
    });

    return matches;
  }

  function validateContext(context = {}) {
    const normalized = normalizeContext(context);
    const categoryTotal = totalMinutes(normalized.usage);
    const errors = [];
    const warnings = [];

    CATEGORIES.forEach((category) => {
      if (normalized.usage[category] > 1440) {
        errors.push(`${CATEGORY_LABELS[category]} cannot exceed 1,440 minutes in one day.`);
      }
    });

    if (categoryTotal <= 0) {
      errors.push("Add at least one minute of screen-time usage before saving.");
    }

    if (categoryTotal > 1440) {
      errors.push("Category totals cannot exceed 1,440 minutes in one day.");
    }

    if (
      normalized.reported_total_minutes !== null &&
      normalized.reported_total_minutes !== categoryTotal
    ) {
      errors.push(
        `Category totals add up to ${categoryTotal} minutes, but the reported total is ${normalized.reported_total_minutes} minutes.`,
      );
    }

    if (normalized.deep_work_minutes > categoryTotal && categoryTotal > 0) {
      warnings.push("Deep-work minutes exceed total screen time. Review this optional value.");
    }

    if (normalized.late_night_minutes > categoryTotal && categoryTotal > 0) {
      warnings.push("Late-night minutes exceed total screen time. Review this optional value.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      category_total_minutes: categoryTotal,
      reported_total_minutes: normalized.reported_total_minutes,
    };
  }

  function scoreLabel(metric, score) {
    if (metric === "focus") {
      if (score >= 75) return "Strong support";
      if (score >= 55) return "Steady potential";
      if (score >= 35) return "Building support";
      return "Needs attention";
    }

    if (metric === "burnout") {
      if (score >= 75) return "High signal";
      if (score >= 50) return "Elevated signal";
      if (score >= 25) return "Worth watching";
      return "Low signal";
    }

    if (score >= 70) return "High signal";
    if (score >= 45) return "Worth watching";
    if (score >= 20) return "Moderate signal";
    return "Well managed";
  }

  function burnoutRisk(score) {
    if (score >= 75) return "High";
    if (score >= 50) return "Elevated";
    if (score >= 25) return "Moderate";
    return "Low";
  }

  function dominantCategory(usage) {
    return CATEGORIES.reduce((largest, category) => {
      return usage[category] > usage[largest] ? category : largest;
    }, CATEGORIES[0]);
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function calculatePrimaryAction(context, derived) {
    const { usage, late_night_minutes: lateNight, deep_work_minutes: deepWork } = context;
    const dominant = derived.dominant_category;

    if (lateNight >= 60) {
      return {
        key: "late-night",
        title: "Create a calmer stopping point tonight",
        action: "Move 30 minutes of late-night screen use earlier and set a clear stop time.",
        reason: `${lateNight} late-night minutes were recorded, the strongest current fatigue contributor.`,
      };
    }

    if (deepWork < 25) {
      return {
        key: "deep-work",
        title: "Protect one focused block tomorrow",
        action: "Reserve 25 minutes for learning or priority work before opening entertainment apps.",
        reason: "No sustained deep-work session was recorded in the latest snapshot.",
      };
    }

    if (dominant === "social" && derived.dominant_ratio >= 0.4) {
      return {
        key: "social",
        title: "Give social use a boundary",
        action: "Choose one planned social window and keep the first 20 minutes of your day app-free.",
        reason: `Social represented ${Math.round(derived.dominant_ratio * 100)}% of recorded screen time.`,
      };
    }

    if (dominant === "games" || dominant === "entertainment") {
      return {
        key: dominant,
        title: "Put one priority before entertainment",
        action: "Complete one 20-minute priority task before your next entertainment session.",
        reason: `${CATEGORY_LABELS[dominant]} was the largest recorded usage category.`,
      };
    }

    if (context.app_switches >= 50) {
      return {
        key: "switching",
        title: "Reduce one source of switching",
        action: "Use focus mode for one 25-minute block and keep only the required app open.",
        reason: `${context.app_switches} app switches were recorded.`,
      };
    }

    if (usage.productivity + usage.learning < derived.total_minutes * 0.25) {
      return {
        key: "productive-ratio",
        title: "Start with one useful task",
        action: "Use the first 20 minutes tomorrow for work, planning, or learning.",
        reason: `Productive activity represented ${Math.round(derived.productive_ratio * 100)}% of recorded screen time.`,
      };
    }

    return {
      key: "maintain",
      title: "Keep the pattern easy to repeat",
      action: "Repeat your strongest focus block at the same time tomorrow.",
      reason: "The latest snapshot does not show one unusually strong source of friction.",
    };
  }

  function calculatePrediction(rawContext = {}) {
    const context = normalizeContext(rawContext);
    const usage = context.usage;
    const total = totalMinutes(usage);
    const productiveMinutes = usage.productivity + usage.learning;
    const leisureMinutes = usage.social + usage.games + usage.entertainment;
    const productiveRatio = total > 0 ? productiveMinutes / total : 0;
    const leisureRatio = total > 0 ? leisureMinutes / total : 0;
    const socialRatio = total > 0 ? usage.social / total : 0;
    const gamesRatio = total > 0 ? usage.games / total : 0;
    const entertainmentRatio = total > 0 ? usage.entertainment / total : 0;
    const recoveryRatio = total > 0 ? usage.health / total : 0;
    const deepWorkRatio = total > 0 ? context.deep_work_minutes / total : 0;
    const lateNightRatio = total > 0 ? context.late_night_minutes / total : 0;
    const usageHours = Math.max(total / 60, 1);
    const switchRate = context.app_switches / usageHours;
    const dominant = dominantCategory(usage);
    const dominantRatio = total > 0 ? usage[dominant] / total : 0;

    let focusScore = Math.round(
      clamp(
        58 +
          productiveRatio * 34 +
          Math.min(context.deep_work_minutes, 120) * 0.18 +
          recoveryRatio * 8 -
          socialRatio * 16 -
          gamesRatio * 24 -
          entertainmentRatio * 18 -
          Math.min((total / 60) * 1.4, 18) -
          Math.max(context.app_switches - 20, 0) * 0.16 -
          Math.max(context.late_night_minutes - 20, 0) * 0.11,
        0,
        100,
      ),
    );

    let fatigueScore = Math.round(
      clamp(
        8 +
          Math.max(total - 240, 0) * 0.105 +
          context.late_night_minutes * 0.23 +
          context.app_switches * 0.08 -
          Math.min(context.deep_work_minutes, 90) * 0.04,
        0,
        100,
      ),
    );

    let distractionScore = Math.round(
      clamp(
        12 +
          leisureRatio * 43 +
          context.app_switches * 0.24 +
          context.app_launches * 0.08 -
          productiveRatio * 18,
        0,
        100,
      ),
    );

    let burnoutScore = Math.round(
      clamp(
        fatigueScore * 0.48 +
          distractionScore * 0.22 +
          Math.max(total - 360, 0) * 0.06 +
          context.late_night_minutes * 0.09 -
          Math.min(context.deep_work_minutes, 90) * 0.04,
        0,
        100,
      ),
    );

    if (total === 0) {
      focusScore = 0;
      fatigueScore = 0;
      distractionScore = 0;
      burnoutScore = 0;
    }

    const confidence = Math.round(
      clamp(
        38 +
          (total > 0 ? 20 : 0) +
          (context.app_switches > 0 ? 7 : 0) +
          (context.deep_work_minutes > 0 ? 7 : 0) +
          (context.app_launches > 0 ? 5 : 0) +
          (context.late_night_minutes > 0 ? 5 : 0),
        0,
        92,
      ),
    );

    const derived = {
      total_minutes: total,
      productive_ratio: productiveRatio,
      leisure_ratio: leisureRatio,
      dominant_category: dominant,
      dominant_ratio: dominantRatio,
    };
    const primaryAction = calculatePrimaryAction(context, derived);
    const factors = [];

    if (total > 0) {
      factors.push({
        key: "screen-load",
        label: "Recorded screen load",
        metrics: ["focus", "fatigue", "burnout"],
        strength: Math.min(100, Math.round((total / 480) * 100)),
        evidence: `${total} total minutes were recorded.`,
      });
    }
    if (dominantRatio >= 0.3) {
      factors.push({
        key: dominant,
        label: `${CATEGORY_LABELS[dominant]} share`,
        metrics: ["focus", "distraction"],
        strength: Math.round(dominantRatio * 100),
        evidence: `${CATEGORY_LABELS[dominant]} represented ${Math.round(dominantRatio * 100)}% of recorded screen time.`,
      });
    }
    if (context.deep_work_minutes < 25) {
      factors.push({
        key: "deep-work",
        label: "Limited sustained focus",
        metrics: ["focus", "distraction"],
        strength: 70,
        evidence: `${context.deep_work_minutes} deep-work minutes were recorded.`,
      });
    }
    if (context.app_switches >= 20) {
      factors.push({
        key: "switching",
        label: "App switching",
        metrics: ["focus", "distraction", "fatigue"],
        strength: Math.min(100, context.app_switches),
        evidence: `${context.app_switches} app switches were recorded.`,
      });
    }
    if (context.late_night_minutes > 0) {
      factors.push({
        key: "late-night",
        label: "Late-night activity",
        metrics: ["fatigue", "burnout"],
        strength: Math.min(100, context.late_night_minutes),
        evidence: `${context.late_night_minutes} late-night minutes were recorded.`,
      });
    }
    if (productiveRatio >= 0.3) {
      factors.push({
        key: "productive-ratio",
        label: "Productive activity",
        metrics: ["focus"],
        strength: Math.round(productiveRatio * 100),
        evidence: `${Math.round(productiveRatio * 100)}% of recorded time supported work or learning.`,
      });
    }

    factors.sort((a, b) => b.strength - a.strength);

    const insights = unique([
      total > 0
        ? `${CATEGORY_LABELS[dominant]} represented ${Math.round(dominantRatio * 100)}% of recorded screen time.`
        : "No screen-time usage has been recorded for this day.",
      productiveRatio < 0.2
        ? `Only ${Math.round(productiveRatio * 100)}% of recorded time supported work or learning.`
        : `${Math.round(productiveRatio * 100)}% of recorded time supported work or learning.`,
      context.deep_work_minutes < 25
        ? "No sustained deep-work session was recorded."
        : `${context.deep_work_minutes} minutes of deeper focus activity were recorded.`,
    ]);

    const result = {
      usage,
      total_minutes: total,
      focus_score: focusScore,
      mental_fatigue_score: fatigueScore,
      fatigue_score: fatigueScore,
      distraction_score: distractionScore,
      burnout_score: burnoutScore,
      burnout_risk: burnoutRisk(burnoutScore),
      productive_ratio: productiveRatio,
      leisure_ratio: leisureRatio,
      social_ratio: socialRatio,
      recovery_ratio: recoveryRatio,
      deep_work_ratio: deepWorkRatio,
      late_night_ratio: lateNightRatio,
      switch_rate: switchRate,
      confidence,
      dominant_category: dominant,
      dominant_ratio: dominantRatio,
      top_category: total > 0 ? dominant : "none",
      labels: {
        focus: scoreLabel("focus", focusScore),
        fatigue: scoreLabel("fatigue", fatigueScore),
        distraction: scoreLabel("distraction", distractionScore),
        burnout: scoreLabel("burnout", burnoutScore),
      },
      factors,
      insights,
      primary_action: primaryAction,
      recommendations: unique([
        primaryAction.action,
        context.app_switches >= 50
          ? "Try one notification-light focus block with only the required app open."
          : "Keep the next change small enough to repeat tomorrow.",
      ]),
      alerts: [],
      model_version: "shared-snapshot-v2",
      source: "local-model",
    };

    return result;
  }

  function canonicalizePrediction(prediction, rawContext) {
    const canonical = calculatePrediction(rawContext);
    const source = prediction && prediction.source ? String(prediction.source) : canonical.source;
    // Scores always come from the current normalized snapshot. This prevents a stale API
    // response or legacy stored result from overriding the shared deterministic model.
    canonical.source = source;
    return canonical;
  }

  function normalizeExtraction(extraction = {}) {
    const statusValues = ["idle", "processing", "ready", "error"];
    const status = statusValues.includes(extraction.status) ? extraction.status : "idle";
    const items = Array.isArray(extraction.items)
      ? extraction.items.map((item) => ({
          app: String(item.app || "Unknown app").trim(),
          category: CATEGORIES.includes(item.category) || item.category === "ignore"
            ? item.category
            : "",
          minutes: wholeMinutes(item.minutes),
          confidence: clamp(finiteNumber(item.confidence), 0, 1),
        }))
      : [];

    return {
      status,
      confidence: clamp(finiteNumber(extraction.confidence), 0, 1),
      reviewed: Boolean(extraction.reviewed),
      items,
      error: extraction.error ? String(extraction.error) : "",
    };
  }

  function createDailySnapshot({
    date = localDateKey(),
    context = {},
    prediction = null,
    source = "manual",
    extraction = {},
    createdAt = null,
    updatedAt = null,
  } = {}) {
    const normalizedContext = normalizeContext(context);
    const now = new Date().toISOString();

    return {
      schema_version: SCHEMA_VERSION,
      date: String(date || localDateKey()),
      created_at: createdAt || now,
      updated_at: updatedAt || now,
      source: String(source || "manual"),
      context: normalizedContext,
      result: canonicalizePrediction(prediction, normalizedContext),
      validation: validateContext(normalizedContext),
      extraction: normalizeExtraction(extraction),
    };
  }

  function normalizeSnapshot(snapshot, fallbackDate = localDateKey()) {
    if (!snapshot || typeof snapshot !== "object") {
      return createDailySnapshot({ date: fallbackDate });
    }

    const context = snapshot.context || {
      usage: snapshot.usage || {},
      app_switches: snapshot.app_switches,
      late_night_minutes: snapshot.late_night_minutes,
      deep_work_minutes: snapshot.deep_work_minutes,
      app_launches: snapshot.app_launches,
      reported_total_minutes: snapshot.reported_total_minutes,
    };

    return createDailySnapshot({
      date: snapshot.date || fallbackDate,
      context,
      prediction: snapshot.result || snapshot.prediction || snapshot,
      source: snapshot.source || "migrated",
      extraction: snapshot.extraction,
      createdAt: snapshot.created_at || snapshot.createdAt,
      updatedAt: snapshot.updated_at || snapshot.updatedAt,
    });
  }

  function migrateLegacyState({ context, prediction, history, date } = {}) {
    const snapshots = (Array.isArray(history) ? history : [])
      .filter(Boolean)
      .map((entry) => normalizeSnapshot(entry, entry.date || date));

    if (context || prediction) {
      const current = createDailySnapshot({
        date: date || localDateKey(),
        context: context || prediction?.context || {},
        prediction,
        source: "migrated",
      });
      return upsertSnapshot(snapshots, current);
    }

    return uniqueSnapshots(snapshots);
  }

  function uniqueSnapshots(snapshots = []) {
    const byDate = new Map();
    snapshots.forEach((snapshot) => {
      const normalized = normalizeSnapshot(snapshot, snapshot?.date);
      const existing = byDate.get(normalized.date);
      if (!existing || normalized.updated_at >= existing.updated_at) {
        byDate.set(normalized.date, normalized);
      }
    });
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  function upsertSnapshot(snapshots = [], snapshot) {
    return uniqueSnapshots([
      ...snapshots.filter((entry) => entry && entry.date !== snapshot.date),
      normalizeSnapshot(snapshot, snapshot.date),
    ]);
  }

  function previousSnapshot(snapshots = [], date = localDateKey()) {
    return uniqueSnapshots(snapshots)
      .filter((snapshot) => snapshot.date < date && snapshot.validation.valid)
      .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }

  function metricComparison(metric, currentSnapshot, snapshots = []) {
    const fields = {
      focus: "focus_score",
      fatigue: "mental_fatigue_score",
      distraction: "distraction_score",
      burnout: "burnout_score",
    };
    const field = fields[metric];
    const previous = currentSnapshot
      ? previousSnapshot(snapshots, currentSnapshot.date)
      : null;
    const currentValue = field && currentSnapshot ? finiteNumber(currentSnapshot.result[field]) : null;
    const previousValue = field && previous ? finiteNumber(previous.result[field]) : null;

    return {
      current: currentValue,
      previous: previousValue,
      change: previousValue === null || currentValue === null ? null : currentValue - previousValue,
      confidence: currentSnapshot ? finiteNumber(currentSnapshot.result.confidence) : 0,
      factors: currentSnapshot
        ? currentSnapshot.result.factors.filter((factor) => factor.metrics.includes(metric)).slice(0, 3)
        : [],
    };
  }

  function parseDateKey(dateKey) {
    const [year, month, day] = String(dateKey).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function offsetDateKey(dateKey, dayOffset) {
    const date = parseDateKey(dateKey);
    date.setDate(date.getDate() + dayOffset);
    return localDateKey(date);
  }

  function buildTrend(snapshots = [], endDate = localDateKey(), days = 7) {
    const byDate = new Map(uniqueSnapshots(snapshots).map((snapshot) => [snapshot.date, snapshot]));
    const slots = [];

    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = offsetDateKey(endDate, -offset);
      const snapshot = byDate.get(date) || null;
      slots.push({
        date,
        snapshot,
        missing: !snapshot || !snapshot.validation.valid,
        focus: snapshot?.validation.valid ? snapshot.result.focus_score : null,
        fatigue: snapshot?.validation.valid ? snapshot.result.mental_fatigue_score : null,
      });
    }

    const available = slots.filter((slot) => !slot.missing);
    const average = (field) =>
      available.length
        ? Math.round(available.reduce((total, slot) => total + slot[field], 0) / available.length)
        : null;

    return {
      slots,
      available_days: available.length,
      insufficient: available.length < Math.min(days, 2),
      average_focus: average("focus"),
      average_fatigue: average("fatigue"),
      best_focus_date:
        available.length > 0
          ? available.reduce((best, slot) => (slot.focus > best.focus ? slot : best)).date
          : null,
    };
  }

  function normalizeMentorText(question = "") {
    return String(question)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .trim()
      .toLowerCase();
  }

  function detectMentorLanguage(question = "") {
    const source = String(question).toLowerCase();
    const normalized = normalizeMentorText(source);
    const hasVietnameseCharacter = /[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i.test(source);
    const hasVietnamesePhrase = [
      "toi nen", "lam gi", "tai sao", "vi sao", "ngay mai", "cam thay", "tap trung",
      "met moi", "xao nhang", "kiet suc", "xu huong", "man hinh", "giup toi",
      "ban co", "giam bot", "thoi gian su dung", "cam on", "xin chao", "cang thang",
      "thu gian", "oke",
    ].some((phrase) => normalized.includes(phrase));
    return hasVietnameseCharacter || hasVietnamesePhrase ? "vi" : "en";
  }

  function detectMentorIntent(question = "") {
    const normalized = normalizeMentorText(question);
    const matches = (terms) => terms.some((term) => normalized.includes(term));

    if (/^(?:ok+|oke+|okay|u|uh|uhm|um|duoc|hieu roi|got it)[.!\s]*$/.test(normalized)) return "acknowledge";
    if (matches(["thank you", "thanks", "cam on", "cảm ơn"])) return "thanks";
    if (matches(["hello", "hi there", "good morning", "good evening", "xin chao", "chao ban"])) return "greeting";
    if (matches(["what can you do", "how can you help", "ban lam duoc gi", "ban co the lam gi", "co the hoi gi"])) return "capabilities";
    if (matches([
      "reduce screen time", "use my phone less", "use less", "cut down", "too much screen time",
      "giam thoi gian", "giam bot thoi gian", "giam screen time", "co nen giam", "dung dien thoai it",
    ])) return "screen_time";
    if (matches(["stress", "stressed", "relax", "sleep better", "cang thang", "thu gian", "ngu ngon", "nghi ngoi"])) return "wellbeing";
    if (matches(["plan tomorrow", "tomorrow plan", "plan my day", "tomorrow", "ke hoach ngay mai", "ngay mai"])) return "plan";
    if (matches(["why", "change", "cause", "reason", "contributor", "tai sao", "vi sao", "thay doi", "nguyen nhan"])) return "explain";
    if (matches(["how might i feel", "how will i feel", "how i feel", "feel today", "emotion", "cam thay", "tam trang"])) {
      return "feel";
    }
    if (matches(["what should i do", "what can i do", "next step", "recommend", "help me", "toi nen lam gi", "nen lam gi", "loi khuyen", "giup toi", "toi co nen", "co nen"])) {
      return "action";
    }
    if (matches(["trend", "week", "history", "improving", "baseline", "xu huong", "tuan", "lich su"])) return "trend";
    if (matches(["score", "focus", "fatigue", "distraction", "burnout", "diem", "tap trung", "met moi", "xao nhang", "kiet suc"])) return "metric";
    return "general";
  }

  function historySentence(snapshot, snapshots) {
    const comparison = metricComparison("focus", snapshot, snapshots);
    if (comparison.change === null) {
      return "More daily snapshots are needed before a personal trend can be described.";
    }
    if (comparison.change === 0) return "Your focus estimate is unchanged from the previous saved day.";
    const direction = comparison.change > 0 ? "higher" : "lower";
    return `Your focus estimate is ${Math.abs(comparison.change)} points ${direction} than the previous saved day.`;
  }

  function vietnameseHistorySentence(snapshot, snapshots) {
    const comparison = metricComparison("focus", snapshot, snapshots);
    if (comparison.change === null) {
      return "Cần thêm ảnh chụp hằng ngày trước khi có thể mô tả xu hướng cá nhân.";
    }
    if (comparison.change === 0) return "Ước tính tập trung không đổi so với ngày đã lưu trước đó.";
    const direction = comparison.change > 0 ? "cao hơn" : "thấp hơn";
    return `Ước tính tập trung ${direction} ${Math.abs(comparison.change)} điểm so với ngày đã lưu trước đó.`;
  }

  function vietnameseAction(primaryAction) {
    const actions = {
      "late-night": "Chuyển 30 phút sử dụng màn hình ban đêm sang sớm hơn và đặt giờ dừng rõ ràng.",
      "deep-work": "Dành 25 phút cho việc học hoặc công việc ưu tiên trước khi mở ứng dụng giải trí.",
      social: "Chọn một khung giờ dùng mạng xã hội và không mở ứng dụng trong 20 phút đầu ngày.",
      games: "Hoàn thành một việc ưu tiên trong 20 phút trước phiên chơi tiếp theo.",
      entertainment: "Hoàn thành một việc ưu tiên trong 20 phút trước phiên giải trí tiếp theo.",
      switching: "Bật chế độ tập trung trong 25 phút và chỉ mở ứng dụng cần thiết.",
      "productive-ratio": "Dùng 20 phút đầu ngày mai cho công việc, lập kế hoạch hoặc học tập.",
      maintain: "Lặp lại khung tập trung hiệu quả nhất vào cùng thời điểm ngày mai.",
    };
    return actions[primaryAction.key] || "Chọn một thay đổi nhỏ và có thể lặp lại vào ngày mai.";
  }

  function buildMentorResponse(question, latestSnapshot, snapshots = []) {
    const language = detectMentorLanguage(question);
    const intent = detectMentorIntent(question);
    const snapshot = latestSnapshot ? normalizeSnapshot(latestSnapshot, latestSnapshot.date) : null;

    const basicAnswers = language === "vi"
      ? {
          acknowledge: "Ừ, mình hiểu rồi. Bạn cứ hỏi tiếp điều bạn muốn biết về screen time hoặc kế hoạch ngày mai nhé.",
          thanks: "Không có gì. Mình ở đây nếu bạn muốn xem lại dữ liệu hoặc chọn một bước nhỏ cho ngày mai.",
          greeting: "Chào bạn. Mình có thể giúp giải thích điểm số, xem yếu tố ảnh hưởng, điều chỉnh screen time hoặc lập kế hoạch cho ngày mai.",
          capabilities: "Bạn có thể hỏi mình: vì sao điểm tập trung thay đổi, có nên giảm screen time không, nhóm app nào ảnh hưởng nhiều nhất, xu hướng tuần này, hoặc nên làm gì ngày mai.",
        }
      : {
          acknowledge: "Got it. Ask me anything else about your screen time or tomorrow's plan.",
          thanks: "You're welcome. I can help review the data or choose one small next step whenever you want.",
          greeting: "Hello. I can explain your scores, identify the strongest contributor, help adjust screen time, or plan tomorrow.",
          capabilities: "You can ask why focus changed, whether to reduce screen time, which app category mattered most, what the week shows, or what to do tomorrow.",
        };
    if (basicAnswers[intent]) {
      return { language, intent, answer: basicAnswers[intent], evidence: "", action: "" };
    }

    if (!snapshot || !snapshot.validation.valid) {
      return {
        language,
        intent,
        answer: language === "vi"
          ? "Mình chưa có ảnh chụp dữ liệu hợp lệ để trả lời dựa trên thông tin của bạn. Hãy kiểm tra và lưu tổng thời gian hôm nay trước."
          : "I do not have a complete saved snapshot to reason from yet. Review today's category totals, save them, and I can explain the strongest pattern without guessing.",
        evidence: language === "vi" ? "Chưa có ảnh chụp dữ liệu hằng ngày hợp lệ." : "No valid daily snapshot is available.",
        action: language === "vi" ? "Kiểm tra và lưu dữ liệu sử dụng hôm nay." : "Review and save today's usage.",
      };
    }

    const result = snapshot.result;
    const factor = result.factors[0];
    const evidence = factor?.evidence || result.insights[0];
    const action = result.primary_action.action;
    const dominantLabel = CATEGORY_LABELS[result.dominant_category];
    const dominantPercent = Math.round(result.dominant_ratio * 100);
    let answer;

    if (language === "vi") {
      const dominantLabelVi = CATEGORY_LABELS_VI[result.dominant_category];
      const evidenceVi = `${dominantLabelVi} chiếm ${dominantPercent}% thời gian màn hình đã ghi nhận.`;
      const actionVi = vietnameseAction(result.primary_action);
      if (intent === "screen_time") {
        const reducibleCategories = ["social", "games", "entertainment"];
        const reducibleCategory = reducibleCategories.reduce((largest, category) => (
          result.usage[category] > result.usage[largest] ? category : largest
        ), reducibleCategories[0]);
        const reducibleMinutes = result.usage[reducibleCategory];
        const reduction = Math.min(30, Math.max(10, Math.round((reducibleMinutes * 0.15) / 5) * 5));
        answer = reducibleMinutes >= 30
          ? `Có, nhưng bạn không cần giảm tất cả. Hãy thử giảm khoảng ${reduction} phút ở nhóm ${CATEGORY_LABELS_VI[reducibleCategory]} đang chiếm nhiều thời gian nhất, rồi giữ nguyên thời gian học hoặc công việc cần thiết. Sau vài ngày, hãy xem điểm và cảm nhận của bạn có thay đổi không.`
          : `Dữ liệu hiện chưa cho thấy cần cắt giảm mạnh. Hãy ưu tiên dùng màn hình có chủ đích, nghỉ ngắn giữa các phiên và giữ một giờ dừng ổn định.`;
      } else if (intent === "wellbeing") {
        answer = `Dữ liệu màn hình không thể đo mức căng thẳng của bạn. Để ngày mai nhẹ hơn, ${actionVi.toLowerCase()} Thêm một khoảng nghỉ không màn hình 5–10 phút và dừng thiết bị sớm hơn trước khi ngủ nếu có thể.`;
      } else if (intent === "feel") {
        answer = `Dữ liệu thời gian màn hình không thể xác định chính xác cảm xúc của bạn. Dữ liệu chỉ cho thấy ${dominantLabelVi} chiếm ${dominantPercent}% thời gian sử dụng và ước tính tập trung là ${result.focus_score}/100. Hãy tự kiểm tra xem lúc này bạn đang tràn đầy năng lượng, bình thường, phân tán hay mệt mỏi.`;
      } else if (intent === "action") {
        answer = `Bước hữu ích nhất lúc này là: ${actionVi} Đây là một thay đổi nhỏ, cụ thể và dễ lặp lại.`;
      } else if (intent === "explain") {
        answer = `Ước tính tập trung hiện tại là ${result.focus_score}/100. ${evidenceVi} ${vietnameseHistorySentence(snapshot, snapshots)} Đây chỉ là mối liên hệ trong dữ liệu sử dụng, không phải bằng chứng về cảm xúc hay tình trạng y khoa.`;
      } else if (intent === "plan") {
        answer = `Kế hoạch cho ngày mai: ${actionVi} Sau đó hãy nghỉ ngắn và chỉ thêm một phiên tập trung nữa nếu phù hợp.`;
      } else if (intent === "trend") {
        const trend = buildTrend(snapshots, snapshot.date);
        answer = trend.available_days < 2
          ? "Chưa có đủ lịch sử để xác định xu hướng đáng tin cậy. Hãy thêm ít nhất một ảnh chụp hằng ngày nữa."
          : `${vietnameseHistorySentence(snapshot, snapshots)} Hiện có ${trend.available_days} ngày đã lưu, với mức tập trung trung bình ${trend.average_focus}/100.`;
      } else if (intent === "metric") {
        answer = `Ước tính tập trung mới nhất là ${result.focus_score}/100 với độ tin cậy ${result.confidence}%. ${evidenceVi} ${vietnameseHistorySentence(snapshot, snapshots)}`;
      } else {
        answer = "Mình chưa hiểu rõ câu hỏi đó. Bạn có thể nói cụ thể hơn, ví dụ: “Tôi có nên giảm screen time không?”, “Vì sao điểm tập trung thay đổi?” hoặc “Lập kế hoạch cho ngày mai”.";
      }
      return { language, intent, answer, evidence: evidenceVi, action: actionVi };
    }

    if (intent === "screen_time") {
      const reducibleCategories = ["social", "games", "entertainment"];
      const reducibleCategory = reducibleCategories.reduce((largest, category) => (
        result.usage[category] > result.usage[largest] ? category : largest
      ), reducibleCategories[0]);
      const reducibleMinutes = result.usage[reducibleCategory];
      const reduction = Math.min(30, Math.max(10, Math.round((reducibleMinutes * 0.15) / 5) * 5));
      answer = reducibleMinutes >= 30
        ? `You do not need to cut all screen time. Try reducing ${CATEGORY_LABELS[reducibleCategory].toLowerCase()} by about ${reduction} minutes while keeping necessary work or learning time. Review the change after a few days.`
        : "The current data does not suggest a large cut. Use screens intentionally, take short breaks, and keep a consistent stopping time.";
    } else if (intent === "wellbeing") {
      answer = `Screen-time data cannot measure stress. To make tomorrow feel lighter, ${action} Add a 5–10 minute screen-free break and stop using devices earlier before sleep if practical.`;
    } else if (intent === "feel") {
      answer =
        `Screen-time metadata cannot determine how you feel. It only shows that ${dominantLabel} represented ${dominantPercent}% of recorded use and your focus estimate is ${result.focus_score}/100. ` +
        "Use that as a prompt to check in with yourself: do you feel energized, neutral, scattered, or tired right now?";
    } else if (intent === "action") {
      answer = `${result.primary_action.title}. ${action} This is the clearest next step because ${result.primary_action.reason.toLowerCase()}`;
    } else if (intent === "explain") {
      const nextFactors = result.factors
        .slice(0, 3)
        .map((item) => item.label.toLowerCase())
        .join(", ");
      answer =
        `The focus estimate is ${result.focus_score}/100. The strongest recorded contributors were ${nextFactors || "the available usage totals"}. ` +
        `${historySentence(snapshot, snapshots)} These are associations in your usage data, not proof of an emotion or medical condition.`;
    } else if (intent === "plan") {
      answer =
        `Tomorrow, start with this one anchor: ${action} Afterward, take a short break and decide whether another focus block is realistic. ` +
        "The plan stays intentionally small so it is easier to repeat.";
    } else if (intent === "trend") {
      const trend = buildTrend(snapshots, snapshot.date);
      answer =
        trend.available_days < 2
          ? "There is not enough saved history for a reliable trend yet. Add at least one more daily snapshot, then I can compare your focus and fatigue estimates across days."
          : `${historySentence(snapshot, snapshots)} The seven-day view currently contains ${trend.available_days} saved days, with an average focus estimate of ${trend.average_focus}/100.`;
    } else if (intent === "metric") {
      answer =
        `Your latest focus estimate is ${result.focus_score}/100 (${result.labels.focus.toLowerCase()}) with ${result.confidence}% model confidence. ` +
        `${evidence} ${historySentence(snapshot, snapshots)}`;
    } else {
      answer = "I did not fully understand that question. Try asking whether to reduce screen time, why focus changed, what affected today's score, or how to plan tomorrow.";
    }

    return { language, intent, answer, evidence, action };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    CATEGORIES,
    CATEGORY_LABELS,
    localDateKey,
    normalizeUsage,
    parseScreenDuration,
    extractAppNameCandidate,
    pairOcrUsageRows,
    normalizeContext,
    totalMinutes,
    validateContext,
    calculatePrediction,
    canonicalizePrediction,
    createDailySnapshot,
    normalizeSnapshot,
    migrateLegacyState,
    uniqueSnapshots,
    upsertSnapshot,
    previousSnapshot,
    metricComparison,
    buildTrend,
    detectMentorLanguage,
    detectMentorIntent,
    buildMentorResponse,
  });
});
