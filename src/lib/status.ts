/**
 * Project statuses (requested by Antonio; replaces spec §4's shipping / in
 * progress / past). Card dots: todo cyan, wip orange, done green
 * (--status-todo, --status-wip, --status-done in tokens.css).
 */
export const PROJECT_STATUSES = ["todo", "wip", "done"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
