// ============================================================
// Server-Funktion "data" (Azure Functions, Node.js):
//   GET  /api/data  → gespeicherten Stand des angemeldeten Nutzers holen
//   POST /api/data  → Stand vom Gerät schicken, mit dem Server-Stand
//                     abgleichen, Ergebnis speichern und zurückgeben
// Anmelden erledigt Azure Static Web Apps (GitHub- oder Microsoft-Konto).
// Wer angemeldet ist, steht im Kopf "x-ms-client-principal".
// Die Datenbank-Verbindung (COSMOS_CONNECTION) steht NUR in den
// Azure-Einstellungen, nie im Code oder auf GitHub.
// Pro Nutzer ein Dokument (id = Nutzer-ID). Version 2 (Freigaben) kann
// darauf aufbauen: Einträge haben schon Besitzer und Freigabe-Felder.
// ============================================================

const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");
const { merge } = require("./merge");

const MAX_BYTES = 1500000; // Cosmos-Dokumente dürfen höchstens 2 MB groß sein
let container = null;

function getContainer() {
  if (!container) {
    const conn = process.env.COSMOS_CONNECTION;
    if (!conn) throw new Error("COSMOS_CONNECTION fehlt in den Azure-Einstellungen");
    const client = new CosmosClient(conn);
    container = client.database(process.env.COSMOS_DB || "workflow").container(process.env.COSMOS_CONTAINER || "userdata");
  }
  return container;
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

async function readDoc(userId) {
  try {
    const { resource } = await getContainer().item(userId, userId).read();
    return resource || null;
  } catch (err) {
    if (err.code === 404) return null;
    throw err;
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
      const stored = strip(await readDoc(user.userId));
      if (request.method === "GET") return { jsonBody: stored };

      const text = await request.text();
      if (text.length > MAX_BYTES) return { status: 413, jsonBody: { error: "Zu viele Daten für den Abgleich" } };
      const incoming = JSON.parse(text || "{}");
      const merged = merge(stored, incoming);
      await getContainer().items.upsert({
        id: user.userId,
        userId: user.userId, // Partitionsschlüssel
        provider: user.identityProvider,
        ...merged,
        savedAt: new Date().toISOString(),
      });
      return { jsonBody: merged };
    } catch (err) {
      context.error("Abgleich fehlgeschlagen", err);
      return { status: 500, jsonBody: { error: "Abgleich auf dem Server fehlgeschlagen" } };
    }
  },
});
