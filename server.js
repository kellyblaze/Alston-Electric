require("dotenv").config();

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const PDFDocument = require("pdfkit");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 4173);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const MAX_JSON_BYTES = 18 * 1024 * 1024;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const CALCOM_BOOKING_URL = process.env.CALCOM_BOOKING_URL || process.env.CALDIY_BOOKING_URL || "";

const defaultState = {
  requests: [],
  pricing: {},
  company: {},
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function normalizeDatabaseUrl(rawUrl = "") {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  try {
    new URL(value);
    return value;
  } catch {
    // Some pasted Supabase URLs include raw password characters like "?".
    // Encode only the password portion so pg can parse the connection string.
    const match = value.match(/^(postgres(?:ql)?:\/\/[^:]+:)(.*)@([^/]+)(\/.*)$/i);
    if (!match) return value;
    const [, prefix, password, host, path] = match;
    return `${prefix}${encodeURIComponent(password)}@${host}${path}`;
  }
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
    })
  : null;

function normalizeState(state = {}) {
  return {
    requests: Array.isArray(state.requests) ? state.requests : [],
    pricing: state.pricing && typeof state.pricing === "object" ? state.pricing : {},
    company: state.company && typeof state.company === "object" ? state.company : {},
  };
}

async function ensureJsonDatabase() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await writeJsonState(defaultState);
  }
}

async function readJsonState() {
  await ensureJsonDatabase();
  try {
    return normalizeState(JSON.parse(await fs.readFile(DB_PATH, "utf8")));
  } catch {
    return defaultState;
  }
}

async function writeJsonState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(normalizeState(state), null, 2));
}

async function readPgState() {
  const [requestsResult, settingsResult] = await Promise.all([
    pool.query(
      `SELECT payload
       FROM estimate_requests
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`,
    ),
    pool.query("SELECT key, value FROM app_settings WHERE key IN ('pricing', 'company')"),
  ]);
  const settings = Object.fromEntries(settingsResult.rows.map((row) => [row.key, row.value]));
  return normalizeState({
    requests: requestsResult.rows.map((row) => row.payload),
    pricing: settings.pricing || {},
    company: settings.company || {},
  });
}

async function writePgRequests(requests) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE estimate_requests SET deleted_at = now() WHERE deleted_at IS NULL");
    for (const request of requests) {
      await client.query(
        `INSERT INTO estimate_requests (public_id, payload, status, customer_name, phone, email, created_at, updated_at, deleted_at)
         VALUES ($1, $2::jsonb, $3, $4, $5, $6, COALESCE(($2::jsonb->>'submittedAt')::timestamptz, now()), now(), NULL)
         ON CONFLICT (public_id) DO UPDATE SET
           payload = EXCLUDED.payload,
           status = EXCLUDED.status,
           customer_name = EXCLUDED.customer_name,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           updated_at = now(),
           deleted_at = NULL`,
        [
          request.id,
          JSON.stringify(request),
          request.status || "New request",
          request.customerName || null,
          request.phone || null,
          request.email || null,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function writePgSetting(key, value) {
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value || {})],
  );
}

async function readState() {
  return pool ? readPgState() : readJsonState();
}

async function writeRequests(requests) {
  if (pool) {
    await writePgRequests(requests);
    return;
  }
  const state = await readJsonState();
  await writeJsonState({ ...state, requests });
}

async function writeSetting(key, value) {
  if (pool) {
    await writePgSetting(key, value);
    return;
  }
  const state = await readJsonState();
  await writeJsonState({ ...state, [key]: value || {} });
}

async function appendTimeline(requestId, message, changes = {}) {
  const state = await readState();
  let updatedRequest = null;
  const requests = state.requests.map((request) => {
    if (request.id !== requestId) return request;
    updatedRequest = {
      ...request,
      ...changes,
      timeline: message ? [...(request.timeline || []), message] : request.timeline,
    };
    return updatedRequest;
  });
  await writeRequests(requests);
  return updatedRequest;
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_JSON_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function safePublicPath(urlPath) {
  const pathname = decodeURIComponent(urlPath);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (!filePath.startsWith(ROOT_DIR)) return null;
  return filePath;
}

function customerQuoteUrl(requestId) {
  return `${PUBLIC_BASE_URL}/#/customer/quote?id=${encodeURIComponent(requestId)}`;
}

function morePhotosUrl(requestId) {
  return `${PUBLIC_BASE_URL}/#/upload-more?id=${encodeURIComponent(requestId)}`;
}

function messageForNotification(type, request) {
  const optOut = " Reply STOP to opt out.";
  if (type === "morePhotos") {
    return `Hi ${request.customerName}, please upload a few more photos so Alston Electric can finish your estimate: ${morePhotosUrl(request.id)}${optOut}`;
  }
  return `Hi ${request.customerName}, your Alston Electric estimate is ready to review: ${customerQuoteUrl(request.id)}${optOut}`;
}

function formatSmsNumber(value = "") {
  const trimmed = String(value || "").trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return trimmed;
}

function telnyxErrorMessage(providerResponse) {
  const errors = providerResponse?.errors;
  if (Array.isArray(errors) && errors.length) {
    return errors
      .map((error) => error.detail || error.title || error.code)
      .filter(Boolean)
      .join("; ");
  }
  return providerResponse?.error || providerResponse?.message || "";
}

async function sendSmsNotification({ requestId, type, to, message }) {
  const state = await readState();
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return { ok: false, simulated: true, error: "Request not found." };

  const recipient = formatSmsNumber(to || request.phone);
  const body = message || messageForNotification(type, request);
  const hasTelnyx = process.env.TELNYX_API_KEY && process.env.TELNYX_FROM_NUMBER;

  if (!hasTelnyx) {
    await appendTimeline(requestId, `SMS simulated: ${type || "quote"}`);
    return { ok: true, simulated: true, to: recipient, message: body };
  }

  const payload = {
    from: process.env.TELNYX_FROM_NUMBER,
    to: recipient,
    text: body,
  };
  if (process.env.TELNYX_MESSAGING_PROFILE_ID) {
    payload.messaging_profile_id = process.env.TELNYX_MESSAGING_PROFILE_ID;
  }

  const result = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const providerResponse = await result.json().catch(() => ({}));
  const errorMessage = telnyxErrorMessage(providerResponse);
  const messageId = providerResponse?.data?.id || "";
  await appendTimeline(
    requestId,
    result.ok
      ? `Telnyx SMS accepted: ${type || "quote"} to ${recipient}${messageId ? ` (${messageId})` : ""}`
      : `Telnyx SMS failed: ${type || "quote"}${errorMessage ? ` - ${errorMessage}` : ""}`,
    {
      lastSmsNotification: {
        provider: "telnyx",
        messageId,
        type: type || "quote",
        to: recipient,
        accepted: result.ok,
        error: errorMessage,
        sentAt: new Date().toISOString(),
        providerResponse,
      },
    },
  );
  return { ok: result.ok, simulated: false, provider: "telnyx", to: recipient, error: errorMessage, providerResponse };
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function telnyxWebhookSummary(event) {
  const eventType = event.data?.event_type || event.event_type || "unknown";
  const payload = event.data?.payload || event.payload || {};
  const direction = payload.direction || "";
  const from = payload.from?.phone_number || payload.from || "";
  const text = payload.text || payload.body || "";
  const messageId = payload.id || payload.message_id || event.data?.id || event.id || "";
  const to = Array.isArray(payload.to) ? payload.to[0]?.phone_number : payload.to?.phone_number || payload.to || "";
  const recipientStatus = Array.isArray(payload.to) ? payload.to[0]?.status : payload.status || "";
  const errors = Array.isArray(payload.errors) ? payload.errors : Array.isArray(event.data?.errors) ? event.data.errors : [];
  const errorText = errors
    .map((error) => error.detail || error.title || error.code)
    .filter(Boolean)
    .join("; ");

  if (eventType.includes("received") || direction === "inbound") {
    return {
      eventType,
      messageId,
      phone: from,
      message: `Inbound SMS received: ${text || "No message body"}`,
      status: "received",
      error: "",
    };
  }

  const status = recipientStatus || eventType.replace(/^message\./, "") || "updated";
  return {
    eventType,
    messageId,
    phone: to,
    message: `Telnyx event: ${eventType}${status ? ` (${status})` : ""}${errorText ? ` - ${errorText}` : ""}`,
    status,
    error: errorText,
  };
}

async function handleTelnyxWebhook(event) {
  const state = await readState();
  const summary = telnyxWebhookSummary(event);
  const phone = normalizePhone(summary.phone);
  let matched = false;

  const requests = state.requests.map((request) => {
    const matchesMessageId = summary.messageId && request.lastSmsNotification?.messageId === summary.messageId;
    const matchesPhone = phone && normalizePhone(request.phone) === phone;
    if (!matchesMessageId && !matchesPhone) return request;
    matched = true;
    return {
      ...request,
      timeline: [...(request.timeline || []), summary.message],
      lastInboundSms: summary.message,
      lastSmsNotification: {
        ...(request.lastSmsNotification || {}),
        messageId: summary.messageId || request.lastSmsNotification?.messageId || "",
        provider: "telnyx",
        deliveryStatus: summary.status,
        deliveryError: summary.error,
        lastWebhookEvent: summary.eventType,
        updatedAt: new Date().toISOString(),
      },
    };
  });

  if (matched) await writeRequests(requests);
  return { ok: true, matched };
}

function generateQuotePdf(response, request, company) {
  const doc = new PDFDocument({ margin: 48, size: "LETTER" });
  response.writeHead(200, {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="${request.id}-quote.pdf"`,
    "cache-control": "no-store",
  });
  doc.pipe(response);

  doc.fontSize(22).text(`${company.name || "Alston Electric"} Quote`, { continued: false });
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor("#59636f").text(`${company.phone || ""} | ${company.email || ""}`);
  doc.moveDown(1);

  doc.fillColor("#101820").fontSize(14).text("Customer", { underline: true });
  doc.fontSize(11).text(request.customerName || "");
  doc.text(request.address || "");
  doc.text(request.email || "");
  doc.moveDown(1);

  doc.fontSize(14).text("Estimate", { underline: true });
  doc.fontSize(12).text(`${request.jobType || "Electrical work"} - ${request.ai?.priceRange || "Pending"}`);
  doc.moveDown(0.5);
  doc.fontSize(11).text(request.ai?.estimatedScope || "Scope pending review.", { lineGap: 3 });
  doc.moveDown(1);

  doc.fontSize(14).text("Quote Message", { underline: true });
  doc.fontSize(10).text(request.quoteMessage || "", { lineGap: 3 });
  doc.moveDown(1);

  doc.fontSize(14).text("Included Materials", { underline: true });
  (request.ai?.materials || []).forEach((item) => doc.fontSize(10).text(`- ${item}`));
  doc.moveDown(1);

  doc.fontSize(9).fillColor("#59636f").text(company.quoteDisclaimer || "Final pricing and scope are subject to professional verification by Alston Electric.");
  doc.end();
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      id: crypto.randomUUID(),
      storage: pool ? "postgres" : "json",
      storedAt: pool ? "DATABASE_URL" : DB_PATH,
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/config") {
    sendJson(response, 200, {
      publicBaseUrl: PUBLIC_BASE_URL,
      calcomBookingUrl: CALCOM_BOOKING_URL,
      caldiyBookingUrl: CALCOM_BOOKING_URL,
      smsEnabled: Boolean(process.env.TELNYX_API_KEY && process.env.TELNYX_FROM_NUMBER),
      smsProvider: process.env.TELNYX_API_KEY ? "telnyx" : "simulation",
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/state") {
    sendJson(response, 200, await readState());
    return true;
  }

  if (request.method === "PUT" && url.pathname === "/api/requests") {
    const body = await readJsonBody(request);
    if (!Array.isArray(body.requests)) {
      sendError(response, 400, "Expected { requests: [] }.");
      return true;
    }
    await writeRequests(body.requests);
    sendJson(response, 200, { ok: true, count: body.requests.length });
    return true;
  }

  if (request.method === "PUT" && url.pathname === "/api/pricing") {
    const body = await readJsonBody(request);
    await writeSetting("pricing", body.pricing || {});
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === "PUT" && url.pathname === "/api/company") {
    const body = await readJsonBody(request);
    await writeSetting("company", body.company || {});
    sendJson(response, 200, { ok: true });
    return true;
  }

  const pdfMatch = url.pathname.match(/^\/api\/quotes\/([^/]+)\.pdf$/);
  if (request.method === "GET" && pdfMatch) {
    const state = await readState();
    const quoteRequest = state.requests.find((item) => item.id === decodeURIComponent(pdfMatch[1]));
    if (!quoteRequest) {
      sendError(response, 404, "Quote request not found.");
      return true;
    }
    generateQuotePdf(response, quoteRequest, state.company || {});
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/notifications/sms") {
    const body = await readJsonBody(request);
    if (!body.requestId) {
      sendError(response, 400, "Expected requestId.");
      return true;
    }
    sendJson(response, 200, await sendSmsNotification(body));
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/webhooks/telnyx") {
    const body = await readJsonBody(request);
    sendJson(response, 200, await handleTelnyxWebhook(body));
    return true;
  }

  return false;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(request, response, url);
      if (!handled) sendError(response, 404, "API route not found.");
      return;
    }

    const filePath = safePublicPath(url.pathname);
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const body = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "content-type": contentType });
    response.end(body);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    sendError(response, 500, error.message || "Server error.");
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Alston Electric MVP running at http://localhost:${PORT}`);
    console.log(`Storage: ${pool ? "Postgres" : "local JSON file"}`);
  });
}

module.exports = {
  handleApi,
  readState,
  writeRequests,
  writeSetting,
  appendTimeline,
  messageForNotification,
  customerQuoteUrl,
  morePhotosUrl,
};
