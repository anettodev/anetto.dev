import type { APIRoute } from "astro";

import { notesFeed } from "../lib/notes-feed";

/* The Hugo site's feed address: readers subscribed there now get the notes. */
export const GET: APIRoute = (context) => notesFeed(context, "/index.xml");
