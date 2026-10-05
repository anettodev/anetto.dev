#!/usr/bin/env node
/*
 * Refreshes src/data/github-activity.json, the snapshot behind the GitHub
 * Activity section (components/GitHubActivity.astro):
 *
 *   npm run github:refresh
 *
 * The build reads only the snapshot, so it never needs the network or a
 * token. The GraphQL API needs a token: GITHUB_TOKEN if set (CI), else the
 * GitHub CLI's (`gh auth token`). It is sent to api.github.com only.
 *
 * Privacy: the calendar counts private contributions the way the public
 * profile does (counts only). Repositories are kept only when public, so a
 * private repository's name never reaches the site, whoever's token runs this.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const LOGIN = "anettodev";
/** The orbs on the page; GitHubActivity.astro has a colour for each of five. */
const TOP_REPOS = 5;
const OUT = fileURLToPath(
  new URL("../src/data/github-activity.json", import.meta.url),
);
const LEVEL = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const token =
  process.env.GITHUB_TOKEN ||
  execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();

const query = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
      commitContributionsByRepository(maxRepositories: 25) {
        repository { name owner { login } url isPrivate }
        contributions { totalCount }
      }
    }
  }
}`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
});
const body = await response.json();
if (!response.ok || body.errors) {
  console.error("GitHub API error:", response.status, body.errors ?? body);
  process.exit(1);
}

const collection = body.data.user.contributionsCollection;
const calendar = collection.contributionCalendar;
const snapshot = {
  login: LOGIN,
  // The local date (en-CA formats it YYYY-MM-DD); toISOString would give UTC's.
  fetchedAt: new Date().toLocaleDateString("en-CA"),
  total: calendar.totalContributions,
  weeks: calendar.weeks.map((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: LEVEL[day.contributionLevel] ?? 0,
    })),
  ),
  repos: collection.commitContributionsByRepository
    .filter(
      ({ repository, contributions }) =>
        !repository.isPrivate && contributions.totalCount > 0,
    )
    .sort((a, b) => b.contributions.totalCount - a.contributions.totalCount)
    .slice(0, TOP_REPOS)
    .map(({ repository, contributions }) => ({
      name: repository.name,
      owner: repository.owner.login,
      url: repository.url,
      commits: contributions.totalCount,
    })),
};

writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `${snapshot.total} contributions, ${snapshot.weeks.length} weeks, top repos: ${snapshot.repos.map((r) => `${r.name} (${r.commits})`).join(", ")} -> ${OUT}`,
);
