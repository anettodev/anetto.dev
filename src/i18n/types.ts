import type { ProjectStatus } from "../lib/status";
import type { RouteKey } from "./routes";

export interface UIStrings {
  siteName: string;
  skipToContent: string;
  navLabel: string;
  nav: Record<RouteKey, string>;
  sayHello: string;
  card: {
    /** Stays in English in every locale until confirmed (spec §9, §14 #6). */
    role: string;
    place: string;
    profilesLabel: string;
    portraitAlt: string;
  };
  status: Record<ProjectStatus, string>;
  screenPlaceholder: string;
  devOnly: string;
  notFound: { title: string; body: string; home: string };
}
