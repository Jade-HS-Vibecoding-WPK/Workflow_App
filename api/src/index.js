// ============================================================
// Server-Funktion "data" (Azure Functions, Node.js):
//   GET  /api/data  → gespeicherten Stand des angemeldeten Nutzers holen
//   POST /api/data  → Stand vom Gerät schicken, mit dem Server-Stand
//                     abgleichen, Ergebnis speichern und zurückgeben
// Anmelden erledigt Azure Static Web Apps (GitHub- oder Microsoft-Konto).
// Wer angemeldet ist, steht im Kopf "x-ms-client-principal".
// Speicher: Azure Blob Storage (Speicherkonto, Einstellung STORAGE_CONNECTION)
// – eine JSON-Datei pro Nutzer im Container "userdata". Alternativ Cosmos DB
// (Einstellung COSMOS_CONNECTION), falls verfügbar. Verbindungen stehen NUR
// in den Azure-Einstellungen, nie im Code oder auf GitHub.
// Version 2 (Freigaben) kann darauf aufbauen: Einträge haben schon Besitzer
// und Freigabe-Felder.
// ============================================================

const { app } = require("@azure/functions");
const { merge } = require("./merge");

const MAX_BYTES = 1500000;

// ---------- Speicher: Blob Storage (Standard) oder Cosmos DB ----------
let store = null;
function getStore() {
  if (store) return store;
  if (process.env.STORAGE_CONNECTION) {
    const { BlobServiceClient } = require("@azure/storage-blob");
    const container = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION)
      .getContainerClient(process.env.STORAGE_CONTAINER || "userdata");
    let ready = null;
    // Container beim ersten Mal anlegen (privat, kein öffentlicher Zugriff); bei Fehler beim nächsten Mal neu versuchen
    const ensure = () => (ready = ready || container.createIfNotExists().catch((e) => { ready = null; throw e; }));
    // Dateiname aus der Nutzer-ID (nur sichere Zeichen)
    const blob = (userId) => container.getBlockBlobClient(String(userId).replace(/[^a-zA-Z0-9_-]/g, "_") + ".json");
    store = {
      async read(userId) {
        await ensure();
        try {
          const buf = await blob(userId).downloadToBuffer();
          return JSON.parse(buf.toString("utf8"));
        } catch (err) {
          if (err.statusCode === 404) return null;
          throw err;
        }
      },
      async write(userId, doc) {
        await ensure();
        const text = JSON.stringify(doc);
        await blob(userId).upload(text, Buffer.byteLength(text), { blobHTTPHeaders: { blobContentType: "application/json" } });
      },
    };
  } else if (process.env.COSMOS_CONNECTION) {
    const { CosmosClient } = require("@azure/cosmos");
    const container = new CosmosClient(process.env.COSMOS_CONNECTION)
      .database(process.env.COSMOS_DB || "workflow").container(process.env.COSMOS_CONTAINER || "userdata");
    store = {
      async read(userId) {
        try { const { resource } = await container.item(userId, userId).read(); return resource || null; }
        catch (err) { if (err.code === 404) return null; throw err; }
      },
      async write(userId, doc) { await container.items.upsert({ id: userId, userId, ...doc }); },
    };
  } else {
    throw new Error("STORAGE_CONNECTION (oder COSMOS_CONNECTION) fehlt in den Azure-Einstellungen");
  }
  return store;
}

function principal(request) {
  const header = request.headers.get("x-ms-client-principal");
  if (!header) return null;
  try {
    const p = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    return p && p.userId ? p : null;
  } catch {
    return null;
  }
}

const strip = (doc) => (doc ? { entries: doc.entries || {}, deleted: doc.deleted || {}, settings: doc.settings || {}, settingsUpdatedAt: doc.settingsUpdatedAt || null } : { entries: {}, deleted: {}, settings: {}, settingsUpdatedAt: null });

app.http("data", {
  methods: ["GET", "POST"],
  authLevel: "anonymous", // geschützt über staticwebapp.config.json (nur angemeldete Nutzer)
  route: "data",
  handler: async (request, context) => {
    const user = principal(request);
    if (!user) return { status: 401, jsonBody: { error: "Nicht angemeldet" } };
    try {
      const stored = strip(await getStore().read(user.userId));
      if (request.method === "GET") return { jsonBody: stored };

      const text = await request.text();
      if (text.length > MAX_BYTES) return { status: 413, jsonBody: { error: "Zu viele Daten für den Abgleich" } };
      const incoming = JSON.parse(text || "{}");
      const merged = merge(stored, incoming);
      await getStore().write(user.userId, {
        ...merged,
        provider: user.identityProvider,
        savedAt: new Date().toISOString(),
      });
      return { jsonBody: merged };
    } catch (err) {
      context.error("Abgleich fehlgeschlagen", err);
      return { status: 500, jsonBody: { error: "Abgleich auf dem Server fehlgeschlagen" } };
    }
  },
});
