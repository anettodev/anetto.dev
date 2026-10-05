/** The usage-over-time chart's spans in days (the card's buttons), and the first shown. */
export const CHART_RANGES = [7, 15, 30, 60, 90, 180, 360] as const;
export const DEFAULT_RANGE = 7;
/** Spans this long plot a 7-day average per week instead of every day. */
export const WEEKLY_FROM = 180;
