const { Readable, Writable } = require("node:stream");
const { handleApi } = require("../backend.js");

function createNodeRequest(request) {
  const readable = request.body ? Readable.fromWeb(request.body) : Readable.from([]);
  readable.method = request.method;
  readable.url = new URL(request.url).pathname + new URL(request.url).search;
  readable.headers = Object.fromEntries(request.headers.entries());
  return readable;
}

class CaptureResponse extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }

  getBody() {
    return Buffer.concat(this.chunks);
  }
}

module.exports = async function handler(request) {
  const nodeRequest = createNodeRequest(request);
  const capture = new CaptureResponse();
  const url = new URL(request.url);

  const handled = await handleApi(nodeRequest, capture, url);
  if (!handled) {
    return new Response("Not found", { status: 404 });
  }

  const body = capture.getBody();
  const headers = new Headers(capture.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  return new Response(body, { status: capture.statusCode, headers });
};
