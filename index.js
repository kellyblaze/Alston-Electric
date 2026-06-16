require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const { handleApi } = require("./backend.js");

const ROOT_DIR = __dirname;
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

function safePublicPath(urlPath) {
  const pathname = decodeURIComponent(urlPath);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (!filePath.startsWith(ROOT_DIR)) return null;
  return filePath;
}

async function serveStaticAsset(request, response) {
  const url = new URL(request.url, "http://localhost");
  const filePath = safePublicPath(url.pathname);
  if (!filePath) {
    response.statusCode = 403;
    response.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const targetFile = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const body = await fs.readFile(targetFile);
    const ext = path.extname(targetFile).toLowerCase();
    response.statusCode = 200;
    response.setHeader("content-type", mimeTypes[ext] || "application/octet-stream");
    response.end(body);
  } catch {
    try {
      const body = await fs.readFile(path.join(ROOT_DIR, "index.html"));
      response.statusCode = 200;
      response.setHeader("content-type", mimeTypes[".html"]);
      response.end(body);
    } catch (error) {
      response.statusCode = 500;
      response.end(String(error && error.message ? error.message : error));
    }
  }
}

module.exports = async function handler(request, response) {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    return handleApi(request, response, url);
  }
  return serveStaticAsset(request, response);
};
