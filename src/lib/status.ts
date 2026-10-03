/** Project status words (spec §4: shipping / in progress / past). */
export const PROJECT_STATUSES = ["shipping", "in-progress", "past"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
