#!/usr/bin/env node
/*
 * Refreshes src/data/ai-usage.json, the snapshot behind the AI usage section
 * (components/AiUsage.astro) and the /ai page:
 *
 *   npm run ai:refresh
 *
 * The source is the public tokscale profile (tokscale.ai/api/users/<name>),
 * which `npx tokscale@latest submit` keeps current from this Mac's AI tool
 * logs. No token is needed. The build reads only the snapshot.
 *
 * Offline preview: AI_USAGE_FILE=<file> npm run ai:refresh reads a local
 * `npx tokscale@latest graph --output <file>` export instead; nothing is
 * uploaded or fetched.
 *
 * Privacy: only the numbers the page shows are kept. The profile also lists
 * the MCP servers configured on the machine, the user id and the devices;
 * none of that reaches the site.
 *
 * Agents (Claude Code's subagents: Workflow Subagent, Explore, Plan…) aren't
 * in the public profile. tokscale's interactive app works them out from this
 * Mac's logs and caches them in ~/.config/tokscale/cache/tui-data-cache.json
 * (open `npx tokscale@latest` to bring it up to date); the refresh copies
 * each agent's name, tool, tokens and messages from there, nothing else. Without that cache (CI), the agents already in the snapshot stay.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const USERNAME = "anettodev";
const API = `https://tokscale.ai/api/users/${USERNAME}`;
const OUT = fileURLToPath(
  new URL("../src/data/ai-usage.json", import.meta.url),
);

const file = process.env.AI_USAGE_FILE;
let source;
if (file) {
  source = JSON.parse(readFileSync(file, "utf8"));
} else {
  const response = await fetch(API, {
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) {
    console.error(
      `No tokscale profile for ${USERNAME} yet. Run \`npx tokscale@latest login\`, then \`npx tokscale@latest submit\`.`,
    );
    process.exit(1);
  }
  if (!response.ok) {
    console.error(
      "tokscale API error:",
      response.status,
      await response.text(),
    );
    process.exit(1);
  }
  source = await response.json();
}

const KINDS = ["input", "output", "cacheRead", "cacheWrite", "reasoning"];
const sum = (tokens) => KINDS.reduce((n, kind) => n + (tokens?.[kind] ?? 0), 0);
const round = (n) => Math.round(n * 100) / 100;

/*
 * A day lists its clients. The API nests each client's models under
 * `models`; a graph export has one entry per client and model (`modelId`).
 */
const entriesOf = (day) =>
  (day.clients ?? []).flatMap((client) =>
    client.models
      ? Object.entries(client.models).map(([model, usage]) => ({
          client: client.client,
          model,
          tokens: usage,
          cost: usage.cost ?? 0,
          messages: usage.messages ?? 0,
        }))
      : [
          {
            client: client.client,
            model: client.modelId,
            tokens: client.tokens,
            cost: client.cost ?? 0,
            messages: client.messages ?? 0,
          },
        ],
  );

/*
 * Days without token counts are left out. Cursor's history before mid-2025
 * has requests but no tokens or cost; counting those days (or their messages)
 * would let the range, active days and messages cover different spans.
 */
const tokensOf = (day) => day.totals?.tokens ?? sum(day.tokenBreakdown);
const contributions = [...(source.contributions ?? [])]
  .filter((day) => tokensOf(day) > 0)
  .sort((a, b) => a.date.localeCompare(b.date));
/*
 * The Models and Tools panels show one period at a time: the last N days
 * (today included) for each N in PERIOD_DAYS. For each period, `periods[N]`
 * holds the cost and tokens per tool and per model, and each row's
 * `shareDelta`: its share of the period's cost minus its share of the
 * previous N days' cost (a fraction; null when nothing came before).
 */
const PERIOD_DAYS = [7, 15, 30];
// The local date (en-CA formats it YYYY-MM-DD); toISOString would give UTC's.
const today = new Date().toLocaleDateString("en-CA");
const daysAgo = (date) =>
  Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
const tally = () => ({
  client: new Map(),
  model: new Map(),
  cost: 0,
  tokens: 0,
});
const periods = PERIOD_DAYS.map((days) => ({
  days,
  now: tally(),
  before: tally(),
}));

const totals = Object.fromEntries(KINDS.map((kind) => [kind, 0]));
const byModel = new Map();
const byClient = new Map();
let messages = 0;
let cost = 0;
const add = (map, key, tokens, amount) => {
  const row = map.get(key) ?? { tokens: 0, cost: 0 };
  row.tokens += tokens;
  row.cost += amount;
  map.set(key, row);
};
for (const day of contributions) {
  for (const entry of entriesOf(day)) {
    for (const kind of KINDS) totals[kind] += entry.tokens?.[kind] ?? 0;
    const tokens = sum(entry.tokens);
    if (entry.model) add(byModel, entry.model, tokens, entry.cost);
    add(byClient, entry.client, tokens, entry.cost);
    messages += entry.messages;
    cost += entry.cost;
    const ago = daysAgo(day.date);
    for (const period of periods) {
      const part =
        ago < period.days
          ? period.now
          : ago < 2 * period.days
            ? period.before
            : null;
      if (!part) continue;
      add(part.client, entry.client, tokens, entry.cost);
      if (entry.model) add(part.model, entry.model, tokens, entry.cost);
      part.cost += entry.cost;
      part.tokens += tokens;
    }
  }
}

/*
 * Everything is summed from the daily contributions, which cover the whole
 * history. The API's own `stats.activeDays` and `modelUsage` cover only its
 * last-year chart window while its token and cost totals cover everything,
 * so mixing them would leave model shares short of 100%. Its totals serve
 * as a check.
 */
const stats = source.stats;
if (
  stats &&
  Math.abs(stats.totalTokens - sum(totals)) > stats.totalTokens * 0.005
) {
  console.warn(
    `Warning: the profile's total (${stats.totalTokens} tokens) differs from its days (${sum(totals)}).`,
  );
}
const rows = (map) =>
  [...map]
    .map(([name, row]) => ({
      name,
      tokens: row.tokens,
      cost: round(row.cost),
    }))
    .filter((row) => row.tokens > 0)
    .sort((a, b) => b.cost - a.cost || b.tokens - a.tokens);

/*
 * A period's rows by cost, each with its share change against the period
 * before. Rows used then but not now follow at zero, falling the whole share
 * they had, so the changes add up and the shift shows.
 */
function periodRows(now, before, kind) {
  const compare = now.cost > 0 && before.cost > 0;
  const shareBefore = (name) =>
    (before[kind].get(name)?.cost ?? 0) / before.cost;
  const fourDecimals = (n) => Math.round(n * 10_000) / 10_000;
  const current = rows(now[kind]).map((row) => ({
    ...row,
    shareDelta: compare
      ? fourDecimals(row.cost / now.cost - shareBefore(row.name))
      : null,
  }));
  const gone = compare
    ? rows(before[kind])
        .filter((row) => !now[kind].has(row.name) && row.cost > 0)
        .map((row) => ({
          name: row.name,
          tokens: 0,
          cost: 0,
          shareDelta: fourDecimals(-shareBefore(row.name)),
        }))
    : [];
  return [...current, ...gone];
}

const AGENTS_CACHE = join(
  homedir(),
  ".config",
  "tokscale",
  "cache",
  "tui-data-cache.json",
);

function readAgents() {
  try {
    const cache = JSON.parse(readFileSync(AGENTS_CACHE, "utf8"));
    const items = (cache.data?.agents ?? [])
      .map((agent) => ({
        name: agent.agent,
        client: [agent.clients].flat().join(",").split(",")[0] || null,
        tokens: sum(agent.tokens),
        messages: agent.messageCount ?? 0,
      }))
      .filter((agent) => agent.name && agent.tokens > 0)
      .sort((a, b) => b.tokens - a.tokens);
    return {
      // The local date (en-CA formats it YYYY-MM-DD).
      updatedAt: new Date(cache.timestamp).toLocaleDateString("en-CA"),
      items,
    };
  } catch {
    // No local cache: keep what the last refresh on the Mac saved.
    try {
      return JSON.parse(readFileSync(OUT, "utf8")).agents ?? null;
    } catch {
      return null;
    }
  }
}

const snapshot = {
  username: source.user?.username ?? USERNAME,
  fetchedAt: today,
  syncedAt:
    source.submissionFreshness?.lastUpdated ?? source.meta?.generatedAt ?? null,
  rank: source.user?.rank ?? null,
  range: {
    start: contributions[0]?.date ?? null,
    end: contributions.at(-1)?.date ?? null,
  },
  totals: {
    tokens: sum(totals),
    cost: round(cost),
    ...totals,
    messages,
    activeDays: contributions.length,
    sessions: stats?.sessionCount ?? source.timeMetrics?.sessionCount ?? null,
  },
  // Each day's tokens per model, for the usage-over-time chart.
  days: contributions.map((day) => {
    const models = {};
    for (const entry of entriesOf(day)) {
      const tokens = sum(entry.tokens);
      if (entry.model && tokens > 0) {
        models[entry.model] = (models[entry.model] ?? 0) + tokens;
      }
    }
    return {
      date: day.date,
      tokens: tokensOf(day),
      cost: round(day.totals?.cost ?? 0),
      models,
    };
  }),
  models: rows(byModel),
  clients: rows(byClient),
  periodDays: PERIOD_DAYS,
  periods: Object.fromEntries(
    periods.map(({ days, now, before }) => [
      days,
      {
        cost: round(now.cost),
        tokens: now.tokens,
        models: periodRows(now, before, "model"),
        clients: periodRows(now, before, "client"),
      },
    ]),
  ),
  agents: readAgents(),
};

writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `${snapshot.totals.tokens} tokens, $${snapshot.totals.cost}, ${snapshot.days.length} days, ${snapshot.models.length} models, clients: ${snapshot.clients.map((c) => c.name).join(", ")}, agents: ${snapshot.agents?.items.map((a) => a.name).join(", ") ?? "none"} -> ${OUT}`,
);
