import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";
import vm from "node:vm";

const { Response } = globalThis;
const origin = "https://example.test";
const base = `${origin}/ssdanielmo/`;
const entry = `${base}index.html`;
const script = `${base}assets/app.js`;
const stylesheet = `${base}assets/app.css`;
const html = `<script src="/ssdanielmo/assets/app.js"></script><link href="/ssdanielmo/assets/app.css">`;
const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function createWorker() {
  const handlers = new Map();
  const stores = new Map();
  const resources = new Map([[entry, html], [script, "app"], [stylesheet, "styles"]]);
  let online = true;

  const fetchResource = async (request) => {
    if (!online) throw new Error("offline");
    const url = typeof request === "string" ? new URL(request, origin).href : request.url;
    const body = resources.get(url);
    return body === undefined ? new Response("Missing", { status: 404 }) : new Response(body);
  };

  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async put(request, response) {
          const url = typeof request === "string" ? new URL(request, origin).href : request.url;
          store.set(url, response.clone());
        },
        async addAll(urls) {
          for (const url of urls) {
            const response = await fetchResource(url);
            if (!response.ok) throw new Error(`Failed to cache ${url}`);
            store.set(url, response);
          }
        },
      };
    },
    async match(request) {
      const url = typeof request === "string" ? new URL(request, origin).href : request.url;
      for (const store of stores.values()) if (store.has(url)) return store.get(url).clone();
      return undefined;
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };

  const self = {
    location: new URL(`${base}sw.js`),
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(name, handler) { handlers.set(name, handler); },
  };

  vm.runInNewContext(source, { self, caches, fetch: fetchResource, Response, URL });

  async function dispatch(name, request) {
    const waits = [];
    let response;
    handlers.get(name)({
      request,
      waitUntil(promise) { waits.push(promise); },
      respondWith(promise) { response = promise; },
    });
    if (response) return response;
    await Promise.all(waits);
  }

  return { caches, dispatch, resources, stores, setOnline(value) { online = value; } };
}

test("installs the app shell and opens it offline after the first visit", async () => {
  const worker = createWorker();
  await worker.dispatch("install");
  const cached = worker.stores.get("routine-os-v3-static");
  assert.deepEqual([...cached.keys()].sort(), [entry, script, stylesheet].sort());

  worker.setOnline(false);
  const page = await worker.dispatch("fetch", { method: "GET", mode: "navigate", url: base });
  assert.equal(await page.text(), html);
  const asset = await worker.dispatch("fetch", { method: "GET", mode: "cors", url: script });
  assert.equal(await asset.text(), "app");
});

test("loads a fresh page online and retains unrelated caches", async () => {
  const worker = createWorker();
  await worker.dispatch("install");
  worker.resources.set(base, "new version");
  const page = await worker.dispatch("fetch", { method: "GET", mode: "navigate", url: base });
  assert.equal(await page.text(), "new version");
  assert.equal(await (await worker.caches.match(entry)).text(), "new version");

  worker.stores.set("routine-os-v2-static", new Map());
  worker.stores.set("other-site-static", new Map());
  await worker.dispatch("activate");
  assert.equal(worker.stores.has("routine-os-v2-static"), false);
  assert.equal(worker.stores.has("other-site-static"), true);
});
