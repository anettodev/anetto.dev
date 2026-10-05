#!/usr/bin/env node
/*
 * Antonio's public Evernote notes for the site, read through Evernote's MCP
 * server (https://mcp.evernote.com/mcp). Evernote no longer issues API keys;
 * its MCP server takes OAuth instead: dynamic client registration, PKCE,
 * no client secret, and refresh tokens, so after one sign-in a scheduled
 * run can keep going on its own.
 *
 *   npm run notes:login   once: approve READ-ONLY access in the browser
 *                         (Evernote's own page; this script never sees the
 *                         password), then list the server's tools
 *
 * Read-only: the server offers read, create, write and delete scopes, and
 * the MCP SDK would ask for all of them unless told otherwise. The sign-in
 * request is rewritten to `scope=read`, and a token granted anything more
 * is thrown away.
 *
 * The sign-in (client registration and tokens) is kept outside the repo,
 * in ~/.config/anetto-dev/evernote-oauth.json, readable only by this user.
 * Nothing secret is printed.
 */
import { execFile } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";

import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const SERVER = new URL("https://mcp.evernote.com/mcp");
const STORE_DIR = join(homedir(), ".config", "anetto-dev");
const STORE = join(STORE_DIR, "evernote-oauth.json");
const PORT = 8790;
const REDIRECT = `http://127.0.0.1:${PORT}/callback`;
const SIGN_IN_TIMEOUT = 5 * 60_000;
const WRITE_SCOPES = ["create", "write", "delete"];

/* ---------- The sign-in store (outside the repo, owner-only) ---------- */

const load = () =>
  existsSync(STORE) ? JSON.parse(readFileSync(STORE, "utf8")) : {};

function save(patch) {
  mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 });
  const next = { ...load(), ...patch };
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) delete next[key];
  }
  writeFileSync(STORE, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  chmodSync(STORE, 0o600);
}

class Provider {
  constructor(interactive) {
    this.interactive = interactive;
  }

  get redirectUrl() {
    return REDIRECT;
  }

  get clientMetadata() {
    return {
      client_name: "anetto.dev notes refresh",
      redirect_uris: [REDIRECT],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "read",
    };
  }

  clientInformation() {
    return load().client;
  }

  saveClientInformation(client) {
    save({ client });
  }

  tokens() {
    return load().tokens;
  }

  saveTokens(tokens) {
    const granted = (tokens.scope ?? "").split(/\s+/);
    if (granted.some((scope) => WRITE_SCOPES.includes(scope))) {
      save({ tokens: undefined });
      throw new Error(
        `Evernote granted more than read access (${tokens.scope}); the token was discarded.`,
      );
    }
    save({ tokens });
  }

  saveCodeVerifier(verifier) {
    save({ verifier });
  }

  codeVerifier() {
    return load().verifier;
  }

  invalidateCredentials(scope) {
    if (scope === "all") save({ client: undefined, tokens: undefined });
    if (scope === "client") save({ client: undefined });
    if (scope === "tokens") save({ tokens: undefined });
    if (scope === "verifier") save({ verifier: undefined });
  }

  redirectToAuthorization(url) {
    if (!this.interactive) {
      throw new Error("Evernote sign-in needed: run `npm run notes:login`.");
    }
    // Read-only, whatever the SDK picked from the server's scope list.
    url.searchParams.set("scope", "read");
    console.log(
      `Opening Evernote to approve read-only access…\nIf no browser opens, visit:\n${url.href}\n`,
    );
    execFile("open", [url.href]);
  }
}

/* ---------- The browser's return trip (localhost, one request) ---------- */

const escapeHtml = (text) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

function listenForCode() {
  let server;
  let timer;
  const code = new Promise((resolve, reject) => {
    server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", REDIRECT);
      if (url.pathname !== "/callback") {
        response.writeHead(404).end();
        return;
      }
      const value = url.searchParams.get("code");
      const error = url.searchParams.get("error") ?? "no code returned";
      response
        .writeHead(200, { "content-type": "text/html; charset=utf-8" })
        .end(
          value
            ? "<p>Done: read-only Evernote access approved for anetto.dev. You can close this tab.</p>"
            : `<p>Not approved: ${escapeHtml(error)}</p>`,
        );
      clearTimeout(timer);
      server.close();
      if (value) resolve(value);
      else reject(new Error(`Evernote sign-in failed: ${error}`));
    });
    server.on("error", (error) =>
      reject(new Error(`Can't listen on ${REDIRECT}: ${error.message}`)),
    );
    server.listen(PORT, "127.0.0.1");
    timer = setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for the Evernote sign-in."));
    }, SIGN_IN_TIMEOUT);
  });
  const close = () => {
    clearTimeout(timer);
    server?.close();
  };
  return { code, close };
}

/* ---------- Connecting ---------- */

async function connect({ interactive }) {
  const provider = new Provider(interactive);
  const client = new Client({ name: "anetto.dev-notes", version: "1.0.0" });
  const callback = interactive ? listenForCode() : null;
  // The first attempt's transport finishes the sign-in: it kept the
  // resource-metadata address from the server's 401.
  const transport = new StreamableHTTPClientTransport(SERVER, {
    authProvider: provider,
  });
  try {
    await client.connect(transport);
    return client;
  } catch (error) {
    if (!(error instanceof UnauthorizedError) || !callback) throw error;
    await transport.finishAuth(await callback.code);
    await client.connect(
      new StreamableHTTPClientTransport(SERVER, { authProvider: provider }),
    );
    return client;
  } finally {
    callback?.close();
  }
}

/* ---------- Commands ---------- */

async function login() {
  const client = await connect({ interactive: true });
  const granted = load().tokens?.scope ?? "(not reported)";
  console.log(`Signed in to Evernote. Granted scope: ${granted}\n`);
  const { tools } = await client.listTools();
  console.log(`The server offers ${tools.length} tools:`);
  for (const tool of tools) {
    const inputs = Object.keys(tool.inputSchema?.properties ?? {});
    const description = (tool.description ?? "").replace(/\s+/g, " ").trim();
    console.log(
      `- ${tool.name}(${inputs.join(", ")})${tool.annotations?.readOnlyHint ? " [read-only]" : ""}\n    ${description.slice(0, 160)}`,
    );
  }
  await client.close();
}

const command = process.argv[2];
if (command === "login") {
  await login();
} else {
  console.error("Usage: node scripts/evernote-notes.mjs login");
  process.exit(1);
}
