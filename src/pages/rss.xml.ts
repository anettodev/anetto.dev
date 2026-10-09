import type { APIRoute } from "astro";

import { FEED_PATH, notesFeed } from "../lib/notes-feed";

export const GET: APIRoute = (context) => notesFeed(context, FEED_PATH);
