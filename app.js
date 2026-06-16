const STORAGE_KEYS = {
  requests: "alston-electric-requests",
  pricing: "alston-electric-pricing",
  company: "alston-electric-company",
  auth: "alston-electric-auth",
};

const hasBrowserLocation = typeof location !== "undefined" && typeof location.href === "string";
const browserHref = hasBrowserLocation ? location.href : "http://localhost/";
const browserOrigin = browserHref.split("#")[0].replace(/\/$/, "");
const PUBLIC_BASE_URL = `${browserOrigin}#`;
const API_ENABLED = hasBrowserLocation && (location.protocol === "http:" || location.protocol === "https:");
let suppressBackendSync = false;
let appConfig = {
  publicBaseUrl: browserOrigin,
  calcomBookingUrl: "",
  caldiyBookingUrl: "",
  smsEnabled: false,
};

const jobTypes = [
  "Electrical repair",
  "Breaker issue",
  "Panel upgrade",
  "EV charger installation",
  "Outlet installation",
  "Switch installation",
  "Ceiling fan installation",
  "Lighting installation",
  "Recessed lighting",
  "Generator hookup",
  "Inspection or code correction",
  "Commercial electrical work",
  "Emergency electrical issue",
  "Other",
];

const statuses = [
  "New request",
  "AI draft ready",
  "Needs more information",
  "Site visit needed",
  "Quote approved",
  "Quote sent",
  "Customer accepted",
  "Customer question",
  "Appointment requested",
  "Appointment confirmed",
  "More photos needed",
  "More photos received",
  "Scheduled",
  "Booked",
  "Completed",
  "Lost",
  "Declined",
];

const dashboardStatusFilters = [
  "Quote sent",
  "Customer accepted",
  "Customer question",
  "Appointment requested",
  "More photos needed",
  "More photos received",
  "Scheduled",
  "Completed",
  "Declined",
  "Lost",
];

const statusFilterAliases = {
  "More photos needed": ["More photos needed", "Needs more information"],
  Scheduled: ["Scheduled", "Booked"],
  "Appointment requested": ["Appointment requested"],
  "Appointment confirmed": ["Appointment confirmed"],
  "Customer question": ["Customer question"],
  "More photos received": ["More photos received"],
  Declined: ["Declined"],
  Lost: ["Lost"],
  "Customer accepted": ["Customer accepted"],
  Completed: ["Completed"],
  "Quote sent": ["Quote sent"],
};

const followUpTemplates = {
  first:
    "Hi, this is Alston Electric. Just checking to see if you had any questions about your electrical estimate.",
  siteVisit:
    "We can confirm final pricing after reviewing the job in person. Would you like to schedule a site visit?",
  morePhotos:
    "To provide a better estimate, please upload a few more photos of the panel and work area.",
  closing:
    "We wanted to follow up one last time to see if you still need help with your electrical project.",
};

const emergencyTerms = [
  "burning smell",
  "sparks",
  "smoke",
  "exposed wires",
  "buzzing panel",
  "wet electrical",
  "power loss",
  "overheating",
  "fire",
  "burn marks",
  "live wire",
];

const MEDIA_PREVIEW_LIMIT_BYTES = 4 * 1024 * 1024;
const TOTAL_PREVIEW_LIMIT_BYTES = 12 * 1024 * 1024;
const ALLOWED_PREVIEW_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
};

const conditionalQuestions = {
  "EV charger installation": [
    "What vehicle do you have?",
    "Do you already have the charger?",
    "Where do you want the charger installed?",
    "Where is the electrical panel located?",
    "About how far is the charger location from the panel?",
    "Is the panel in the garage, outside, basement, or utility room?",
    "Do you know your panel amperage?",
    "Upload a photo of the panel.",
    "Upload a photo of the desired charger location.",
  ],
  "Panel upgrade": [
    "Do you know the current amperage?",
    "Do you know the desired amperage?",
    "Is the panel old, damaged, rusted, or overloaded?",
    "Are breakers tripping?",
    "Are lights flickering?",
    "Is this for insurance, inspection, renovation, or added capacity?",
    "Upload a clear photo of the full panel.",
    "Upload a close-up photo of the panel label if available.",
    "Upload a photo showing the area around the panel.",
  ],
  "Lighting installation": [
    "How many lights need to be installed?",
    "Is there existing wiring?",
    "Is this indoor or outdoor?",
    "What type of ceiling or wall?",
    "Is attic access available?",
    "Do you want a dimmer switch?",
    "Do you already have the light fixtures?",
    "Upload photos of the room or installation area.",
  ],
  "Outlet installation": [
    "How many outlets or switches?",
    "Is this a replacement or a new installation?",
    "Is there existing wiring?",
    "Is this indoor or outdoor?",
    "Is GFCI protection needed?",
    "Is this for a kitchen, bathroom, garage, outdoor area, or general room?",
    "Upload photos of the area.",
  ],
  "Switch installation": [
    "How many outlets or switches?",
    "Is this a replacement or a new installation?",
    "Is there existing wiring?",
    "Is this indoor or outdoor?",
    "Is GFCI protection needed?",
    "Is this for a kitchen, bathroom, garage, outdoor area, or general room?",
    "Upload photos of the area.",
  ],
  "Ceiling fan installation": [
    "Is there an existing ceiling fan?",
    "Is there an existing light fixture?",
    "Is the ceiling already wired?",
    "How high is the ceiling?",
    "Do you already have the fan?",
    "Is the fan remote-controlled or wall-switch controlled?",
    "Upload a photo of the ceiling location.",
  ],
  "Electrical repair": [
    "What stopped working?",
    "When did the problem start?",
    "Are breakers tripping?",
    "Do you smell burning?",
    "Do you see sparks, smoke, buzzing, or discoloration?",
    "Is the issue affecting one area or the whole property?",
    "Has anyone already tried to repair it?",
    "Upload photos of the affected area and panel if possible.",
  ],
  "Commercial electrical work": [
    "What type of business or property is this?",
    "Is this a repair, buildout, upgrade, or maintenance request?",
    "Are blueprints or plans available?",
    "Is after-hours work required?",
    "Is there a deadline?",
    "Is this connected to an inspection or permit issue?",
    "Upload photos, plans, or documents if available.",
  ],
};

const defaultPricing = {
  minimumServiceCall: 125,
  hourlyLaborRate: 95,
  emergencyServiceFee: 175,
  travelFee: 35,
  materialMarkup: 20,
  permitAllowance: 150,
  diagnosticFee: 95,
  evChargerRange: "650-1600",
  panelUpgradeRange: "2200-5200",
  outletRange: "175-450",
  switchRange: "150-375",
  lightingRange: "225-950",
  ceilingFanRange: "225-650",
  generatorRange: "850-2800",
  commercialHourlyRate: 125,
  afterHoursRate: 145,
  weekendRate: 165,
};

const defaultCompany = {
  name: "Alston Electric",
  logo: "",
  phone: "(555) 014-0188",
  email: "estimates@alstonelectric.example",
  serviceArea: "Local residential and commercial electrical service area",
  license: "License number available upon request",
  address: "Add business address",
  website: "https://alstonelectric.example",
  bookingUrl: "",
  businessHours: "Monday to Friday, 8:00 AM to 5:00 PM",
  scheduleBlocks: [],
  emergencyMessage:
    "For urgent electrical hazards, do not touch the affected area. Contact emergency services if there is immediate danger.",
  quoteDisclaimer:
    "This estimate is based on the information, photos, and videos submitted by the customer. Final pricing and scope are subject to review, site conditions, material availability, permit requirements, and professional verification by Alston Electric.",
  standardTerms:
    "Draft estimates are reviewed before sending. Final pricing may change after on-site verification by a licensed electrician.",
};

const app = document.querySelector("#app");

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  syncBackend(key, value);
}

async function syncBackend(key, value) {
  if (!API_ENABLED || suppressBackendSync) return;
  const endpoints = {
    [STORAGE_KEYS.requests]: ["/api/requests", { requests: value }],
    [STORAGE_KEYS.pricing]: ["/api/pricing", { pricing: value }],
    [STORAGE_KEYS.company]: ["/api/company", { company: value }],
  };
  const target = endpoints[key];
  if (!target) return;
  const [url, body] = target;
  try {
    await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.warn("Backend sync failed", error);
  }
}

async function bootstrapBackendState() {
  if (!API_ENABLED) return;
  try {
    const configResponse = await fetch("/api/config", { cache: "no-store" });
    if (configResponse.ok) appConfig = { ...appConfig, ...(await configResponse.json()) };
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) return;
    const state = await response.json();
    suppressBackendSync = true;
    save(STORAGE_KEYS.requests, state.requests || []);
    save(STORAGE_KEYS.pricing, state.pricing || {});
    save(STORAGE_KEYS.company, state.company || {});
  } catch (error) {
    console.warn("Backend bootstrap failed", error);
  } finally {
    suppressBackendSync = false;
  }
}

function money(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getRequests() {
  const existing = load(STORAGE_KEYS.requests, []);
  if (existing.length) return existing;
  const seeded = seedRequests();
  save(STORAGE_KEYS.requests, seeded);
  return seeded;
}

function findRequest(id) {
  return getRequests().find((item) => item.id === id);
}

function updateStoredRequest(id, updater, timelineMessage) {
  let updatedRequest = null;
  const requests = getRequests().map((item) => {
    if (item.id !== id) return item;
    const changes = typeof updater === "function" ? updater(item) : updater;
    updatedRequest = {
      ...item,
      ...changes,
      timeline: timelineMessage ? [...(item.timeline || []), timelineMessage] : item.timeline,
    };
    return updatedRequest;
  });
  save(STORAGE_KEYS.requests, requests);
  return updatedRequest;
}

function currentHashParams() {
  return new URLSearchParams(location.hash.split("?")[1] || "");
}

function requestMatchesStatusFilter(status, filter) {
  if (!filter || filter === "All") return true;
  const aliases = statusFilterAliases[filter] || [filter];
  return aliases.includes(status);
}

function quoteExpirationDate(request) {
  const sourceDate = request.quoteExpiresAt || request.submittedAt || new Date().toISOString();
  const date = new Date(sourceDate);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  if (!request.quoteExpiresAt) {
    date.setDate(date.getDate() + 14);
  }
  return formatMonthDayYear(date);
}

function formatMonthDayYear(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function customerQuoteLink(request) {
  return `${appConfig.publicBaseUrl || browserOrigin}#/customer/quote?id=${encodeURIComponent(request.id)}`;
}

function morePhotosLink(request) {
  return `${appConfig.publicBaseUrl || browserOrigin}#/upload-more?id=${encodeURIComponent(request.id)}`;
}

function getPricing() {
  return { ...defaultPricing, ...load(STORAGE_KEYS.pricing, {}) };
}

function getCompany() {
  return { ...defaultCompany, ...load(STORAGE_KEYS.company, {}) };
}

function getScheduleBlocks(company = getCompany()) {
  return Array.isArray(company.scheduleBlocks) ? company.scheduleBlocks : [];
}

function formatMonthDayYearTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${month}/${day}/${year} ${hour}:${minute} ${suffix}`;
}

function formatScheduleBlock(block) {
  if (!block) return "Unavailable time";
  const date = block.date ? new Date(`${block.date}T12:00:00`) : null;
  const dateLabel = date && !Number.isNaN(date.getTime()) ? formatMonthDayYear(date) : block.date || "Date not set";
  const windowLabel = block.window || "Time not set";
  const reasonLabel = block.reason ? ` - ${block.reason}` : "";
  return `${dateLabel} | ${windowLabel}${reasonLabel}`;
}

function setRoute(hash) {
  window.location.hash = hash;
}

function layout(content, active = "") {
  const company = getCompany();
  const isAdmin = active === "dashboard";
  const navLinks = isAdmin
    ? `
            <a class="nav-link" href="#/">Public Website</a>
            <a class="nav-link" href="#/admin/dashboard">Admin Home</a>
          `
    : `
            <a class="nav-link ${active === "home" ? "active" : ""}" href="#/">Home</a>
            <a class="nav-link admin-only-link" href="#/admin/login">Admin Only</a>
            <a class="primary-button" href="#/request">Request an Estimate</a>
          `;
  return `
    <div class="site-shell">
      <header class="topbar">
        <nav class="nav" aria-label="Primary navigation">
          <a class="brand" href="#/">
            <span class="brand-mark">AE</span>
            <span>${escapeHtml(company.name)}</span>
          </a>
          <div class="nav-links">
${navLinks}
          </div>
        </nav>
      </header>
      ${content}
      <div class="media-lightbox hide" id="media-lightbox" aria-hidden="true">
        <button class="media-lightbox-backdrop" type="button" id="media-lightbox-backdrop" aria-label="Close media viewer"></button>
        <section class="media-lightbox-panel" role="dialog" aria-modal="true" aria-label="Media viewer">
          <button class="media-lightbox-close" type="button" id="media-lightbox-close" aria-label="Close media viewer">Close</button>
          <div class="media-lightbox-media" id="media-lightbox-media"></div>
          <div class="media-lightbox-caption" id="media-lightbox-caption"></div>
        </section>
      </div>
      <footer class="footer">
        <div class="footer-inner">
          <strong>${escapeHtml(company.name)}</strong>
          <span>${escapeHtml(company.phone)} | ${escapeHtml(company.email)}</span>
          <span>${escapeHtml(company.license)}</span>
        </div>
      </footer>
    </div>
  `;
}

function adminLayout(content, active = "dashboard") {
  return layout(`
    <main class="page">
      <div class="admin-layout">
        <aside class="sidebar" aria-label="Admin navigation">
          <a class="${active === "dashboard" ? "active" : ""}" href="#/admin/dashboard">Estimate Requests</a>
          <div class="sidebar-subnav">
            <a class="sidebar-subitem" href="#/customer/quote?id=${encodeURIComponent(getRequests()[0]?.id || "")}">Customer quote view</a>
          </div>
          <a class="${active === "pricing" ? "active" : ""}" href="#/admin/pricing">Pricing Settings</a>
          <a class="${active === "company" ? "active" : ""}" href="#/admin/company">Company Settings</a>
          <a href="#/">Public Website</a>
        </aside>
        <section>${content}</section>
      </div>
    </main>
  `, "dashboard");
}

function homePage() {
  const company = getCompany();
  const pexels = {
    wiring:
      "https://images.pexels.com/photos/3616772/pexels-photo-3616772.jpeg?auto=compress&cs=tinysrgb&w=900",
    breakerPanel: "assets/panel-upgrade-service.jpg",
    repairWires:
      "https://images.pexels.com/photos/3616745/pexels-photo-3616745.jpeg?auto=compress&cs=tinysrgb&w=900",
    outletSwitch: "assets/outlet-switch-service.webp",
    evCharger:
      "https://images.pexels.com/photos/9800000/pexels-photo-9800000.jpeg?auto=compress&cs=tinysrgb&w=900",
    lighting:
      "https://images.pexels.com/photos/11030202/pexels-photo-11030202.jpeg?auto=compress&cs=tinysrgb&w=900",
    ceilingFan: "assets/ceiling-fan-service.webp",
    generator:
      "https://images.pexels.com/photos/5693845/pexels-photo-5693845.jpeg?auto=compress&cs=tinysrgb&w=900",
    commercial:
      "https://images.pexels.com/photos/28942196/pexels-photo-28942196.jpeg?auto=compress&cs=tinysrgb&w=900",
    inspection:
      "https://images.pexels.com/photos/978743/pexels-photo-978743.jpeg?auto=compress&cs=tinysrgb&w=900",
  };
  const services = [
    { name: "Electrical repairs", image: pexels.repairWires },
    { name: "Panel upgrades", image: pexels.breakerPanel },
    { name: "EV charger installation", image: pexels.evCharger },
    { name: "Lighting installation", image: pexels.lighting },
    { name: "Outlet and switch installation", image: pexels.outletSwitch },
    { name: "Ceiling fan installation", image: pexels.ceilingFan },
    { name: "Generator hookups", image: pexels.generator },
    { name: "Commercial electrical work", image: pexels.commercial },
    { name: "Inspection corrections", image: pexels.inspection },
  ];

  return layout(`
    <main class="page">
      <section class="hero photo-hero">
        <div>
          <h1>Fast Electrical Estimates from Your Photos</h1>
          <p>Upload photos or videos of your electrical project, answer a few quick questions, and Alston Electric will review your request before sending next steps.</p>
          <div class="hero-actions">
            <a class="primary-button" href="#/request">Request an Estimate</a>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>How it works</h2>
        <div class="grid grid-4">
          ${["Upload photos or videos.", "Answer a few quick questions.", "Alston Electric reviews your request.", "Receive a professional estimate or next-step recommendation."]
            .map((step, index) => `<article class="card step-card"><span class="step-number">${index + 1}</span><h3>${escapeHtml(step)}</h3></article>`)
            .join("")}
        </div>
      </section>

      <section class="section">
        <h2>Electrical services</h2>
        <p>Use one request form for common repairs, installations, upgrades, inspection corrections, and commercial work.</p>
        <div class="grid grid-3 service-grid">
          ${services.map((service) => `
            <article class="card service-card">
              <img class="service-image" src="${escapeHtml(service.image)}" alt="${escapeHtml(service.name)} visual" loading="lazy" />
              <div class="service-copy">
                <h3>${escapeHtml(service.name)}</h3>
                <span class="muted">Photo-based estimate review</span>
              </div>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="section safety-box">
        <h2>Safety notice</h2>
        <p>For urgent electrical hazards such as smoke, sparks, burning smells, or exposed live wires, do not touch the affected area. Contact emergency services if there is immediate danger.</p>
      </section>

      <section class="section">
        <h2>Start your estimate request</h2>
        <p>Need electrical work? Upload photos or videos of your project, answer a few quick questions, and Alston Electric will review your request before sending a professional estimate or next-step recommendation.</p>
        <a class="primary-button" href="#/request">Open Estimate Form</a>
      </section>

      <section class="section">
        <h2>Contact</h2>
        <div class="grid grid-4">
          <div class="card"><strong>Phone</strong><p>${escapeHtml(company.phone)}</p></div>
          <div class="card"><strong>Email</strong><p>${escapeHtml(company.email)}</p></div>
          <div class="card"><strong>Service area</strong><p>${escapeHtml(company.serviceArea)}</p></div>
          <div class="card"><strong>Business hours</strong><p>${escapeHtml(company.businessHours)}</p></div>
        </div>
      </section>
    </main>
  `, "home");
}

function requestPage() {
  return layout(`
    <main class="page">
      <section class="section">
        <h1>Request an electrical estimate</h1>
        <p class="lead">Upload photos or videos, answer a few job-specific questions, and Alston Electric will review your request before sending any quote.</p>
      </section>
      <form id="estimate-form" class="form-shell">
        <div class="form-section">
          <h2>Customer information</h2>
          <div class="grid grid-2">
            ${field("customerName", "Customer name", "text", true)}
            ${field("phone", "Phone number", "tel", true)}
            ${field("email", "Email address", "email", true)}
            ${field("address", "Service address", "text", true)}
            ${selectField("contactMethod", "Preferred contact method", ["Phone", "Email", "Text message"], true)}
            ${selectField("urgency", "Job urgency", ["Standard", "Soon", "Urgent", "Emergency electrical issue"], true)}
          </div>
        </div>

        <div class="form-section">
          <h2>Project details</h2>
          <div class="grid grid-2">
            ${selectField("jobType", "Job type", jobTypes, true)}
            ${selectField("propertyType", "Property type", ["Residential", "Commercial", "Rental property", "New construction"], true)}
            ${selectField("requestType", "Request type", ["Repair", "Installation", "Upgrade", "Inspection-related request"], true)}
            ${field("appointment", "Preferred appointment time", "text", false, "Example: weekday morning")}
          </div>
          <div class="field" style="margin-top:16px">
            <label for="description">Description of the issue or project</label>
            <textarea id="description" name="description" required placeholder="Tell us what is happening, what you want installed, or what needs to be corrected."></textarea>
          </div>
        </div>

        <div id="emergency-warning" class="emergency-box hide">
          <strong>This may be an electrical safety issue.</strong>
          <p>Do not touch exposed wires or damaged electrical equipment. If there is smoke, fire, or immediate danger, call emergency services. Alston Electric will review your request as soon as possible.</p>
        </div>

        <div id="conditional-section" class="form-section hide"></div>

        <div class="form-section">
          <h2>Photos and videos</h2>
          <div class="grid grid-2">
            ${uploadField("photos", "Photos", "image/*", true)}
            ${uploadField("videos", "Optional videos", "video/*", false)}
          </div>
        </div>

        <div class="form-section">
          <button class="primary-button" type="submit">Submit Estimate Request</button>
        </div>
      </form>
    </main>
  `, "request");
}

function field(name, label, type = "text", required = false, placeholder = "") {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="${type}" ${required ? "required" : ""} placeholder="${escapeHtml(placeholder)}" />
    </div>
  `;
}

function selectField(name, label, options, required = false) {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <select id="${name}" name="${name}" ${required ? "required" : ""}>
        <option value="">Choose one</option>
        ${options.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
      </select>
    </div>
  `;
}

function uploadField(name, label, accept, required) {
  return `
    <div class="field">
      <label for="${name}">${label}</label>
      <div class="upload-zone">
        <input id="${name}" name="${name}" type="file" accept="${accept}" ${required ? "required" : ""} multiple />
        <small>${required ? "Add clear photos of the work area and electrical panel when possible." : "Videos are optional, but helpful for intermittent issues."}</small>
        <div id="${name}-list" class="file-list"></div>
      </div>
    </div>
  `;
}

function bindRequestForm() {
  const form = document.querySelector("#estimate-form");
  if (!form) return;

  const jobType = form.querySelector("#jobType");
  const description = form.querySelector("#description");
  const urgency = form.querySelector("#urgency");

  const updateConditional = () => {
    const questions = conditionalQuestions[jobType.value] || [];
    const section = document.querySelector("#conditional-section");
    if (!questions.length) {
      section.classList.add("hide");
      section.innerHTML = "";
      return;
    }
    section.classList.remove("hide");
    section.innerHTML = `
      <h2>Quick questions for ${escapeHtml(jobType.value)}</h2>
      <div class="grid grid-2">
        ${questions.map((question, index) => `
          <div class="field">
            <label for="smart-${index}">${escapeHtml(question)}</label>
            <input id="smart-${index}" name="smart-${index}" type="text" placeholder="Add details if you know them" />
          </div>
        `).join("")}
      </div>
    `;
  };

  const updateEmergency = () => {
    const combined = `${description.value} ${urgency.value} ${jobType.value}`.toLowerCase();
    const isEmergency = emergencyTerms.some((term) => combined.includes(term)) || jobType.value === "Emergency electrical issue";
    document.querySelector("#emergency-warning").classList.toggle("hide", !isEmergency);
  };

  jobType.addEventListener("change", () => {
    updateConditional();
    updateEmergency();
  });
  urgency.addEventListener("change", updateEmergency);
  description.addEventListener("input", updateEmergency);

  ["photos", "videos"].forEach((name) => {
    bindMediaInputPreview(form, name);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Preparing photo review...";
    const formData = new FormData(form);
    try {
      const request = await buildRequest(formData, form);
      const requests = getRequests();
      requests.unshift(request);
      save(STORAGE_KEYS.requests, requests);
      setRoute(`#/thank-you?id=${request.id}`);
    } catch (error) {
      alert(error.message || "The request could not be saved. Try fewer or smaller files for this local demo.");
      submitButton.disabled = false;
      submitButton.textContent = "Submit Estimate Request";
    }
  });
}

function bindMediaInputPreview(form, name) {
  const input = form.querySelector(`#${name}`);
  if (!input) return;
  input.addEventListener("change", () => {
    form.querySelector(`#${name}-list`).innerHTML = Array.from(input.files || [])
      .map((file) => `<div class="file-pill"><span>${escapeHtml(file.name)}</span><span>${Math.round(file.size / 1024)} KB</span></div>`)
      .join("");
  });
}

async function buildRequest(formData, form) {
  const smartAnswers = {};
  const questions = conditionalQuestions[formData.get("jobType")] || [];
  questions.forEach((question, index) => {
    smartAnswers[question] = formData.get(`smart-${index}`) || "";
  });

  const photos = await buildMediaRecords(form.querySelector("#photos").files, "image");
  const videos = await buildMediaRecords(form.querySelector("#videos").files, "video");

  const request = {
    id: `AE-${Date.now()}`,
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    contactMethod: formData.get("contactMethod"),
    urgency: formData.get("urgency"),
    jobType: formData.get("jobType"),
    propertyType: formData.get("propertyType"),
    requestType: formData.get("requestType"),
    appointment: formData.get("appointment"),
    description: formData.get("description"),
    smartAnswers,
    photos,
    videos,
    submittedAt: new Date().toISOString(),
    status: "AI draft ready",
    notes: "",
    timeline: ["Request submitted", "AI draft generated for Alston Electric review"],
  };
  request.ai = generateAiDraft(request);
  request.quoteMessage = request.ai.customerQuoteDraft;
  return request;
}

async function buildMediaRecords(fileList, kind) {
  const files = Array.from(fileList || []);
  let storedBytes = 0;
  const records = [];

  for (const file of files) {
    const isAcceptedType = ALLOWED_PREVIEW_TYPES[kind].includes(file.type);
    const record = {
      name: file.name,
      type: file.type || `${kind}/unknown`,
      size: file.size,
      kind,
      previewStatus: "stored",
    };

    if (!isAcceptedType) {
      records.push({ ...record, previewStatus: "unsupported" });
      continue;
    }

    if (file.size > MEDIA_PREVIEW_LIMIT_BYTES || storedBytes + file.size > TOTAL_PREVIEW_LIMIT_BYTES) {
      records.push({ ...record, previewStatus: "too-large" });
      continue;
    }

    record.previewData = await readFileAsDataUrl(file);
    storedBytes += file.size;
    records.push(record);
  }

  return records;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error(`Could not read ${file.name}.`)));
    reader.readAsDataURL(file);
  });
}

function previewableCount(files = []) {
  return files.filter((file) => mediaSource(file)).length;
}

function mediaSource(file = {}) {
  return file.previewData || file.previewUrl || "";
}

function mediaReviewSummary(request) {
  const photoCount = request.photos.length;
  const videoCount = request.videos.length;
  const previewablePhotos = previewableCount(request.photos);
  const previewableVideos = previewableCount(request.videos);
  const skippedCount = [...request.photos, ...request.videos].filter((file) => file.previewStatus && file.previewStatus !== "stored").length;

  if (!photoCount && !videoCount) {
    return "No usable photos or videos are attached yet. Request clear photos of the work area, electrical panel, labels, access path, and any visible damage before relying on this draft.";
  }

  const storedSummary = `${previewablePhotos} of ${photoCount} photo${photoCount === 1 ? "" : "s"}${videoCount ? ` and ${previewableVideos} of ${videoCount} video${videoCount === 1 ? "" : "s"}` : ""} can be reviewed directly on this page`;
  const skippedSummary = skippedCount ? ` ${skippedCount} upload${skippedCount === 1 ? " was" : "s were"} kept as metadata because the local demo preview limit was reached.` : "";
  return `${storedSummary}.${skippedSummary} Review the visible media for panel rating, breaker space, wire routing, access, working clearances, damaged parts, scorch marks, moisture, and whether the described work area matches the requested scope.`;
}

function photoReviewChecklist(jobType) {
  const common = ["Panel label or amperage is visible", "Work area and access path are clear", "Any damage, scorch marks, moisture, or exposed wiring is noted"];
  const jobSpecific = {
    "EV charger installation": ["Panel has capacity or needs load calculation", "Charger location and wire route are visible", "Distance from panel to charger area is reasonable"],
    "Panel upgrade": ["Existing panel condition is visible", "Meter and utility side access may need review", "Breaker crowding or rust is documented"],
    "Lighting installation": ["Fixture locations and ceiling access are visible", "Existing switch or wiring condition is shown"],
    "Ceiling fan installation": ["Fan-rated box or current fixture location is visible", "Ceiling height and access are clear"],
    "Outlet installation": ["Requested outlet area is visible", "Nearby existing wiring or GFCI needs are clear"],
    "Switch installation": ["Switch box area is visible", "Existing wiring or device condition is shown"],
    "Electrical repair": ["Affected device or panel area is visible", "Signs of heat, damage, or water exposure are documented"],
    "Commercial electrical work": ["Plans, equipment, or work area context are attached", "Access, deadlines, and after-hours constraints are noted"],
  };
  return [...(jobSpecific[jobType] || []), ...common];
}

function generateAiDraft(request) {
  const pricing = getPricing();
  const description = request.description.toLowerCase();
  const isEmergency = emergencyTerms.some((term) => description.includes(term)) || request.urgency.includes("Emergency");
  const priceRange = estimatePriceRange(request, pricing, isEmergency);
  const photoCount = request.photos.length;
  const previewPhotos = previewableCount(request.photos);
  const previewVideos = previewableCount(request.videos);
  const riskFlags = [
    isEmergency ? "Possible emergency hazard" : "",
    ["Panel upgrade", "EV charger installation", "Generator hookup"].includes(request.jobType) ? "Panel capacity must be verified" : "",
    ["Panel upgrade", "Generator hookup", "Commercial electrical work"].includes(request.jobType) ? "Possible permit needed" : "",
    request.propertyType === "Commercial" ? "Commercial job may require special review" : "",
    photoCount === 0 ? "Customer photos are unclear or missing" : "",
    request.jobType === "EV charger installation" ? "Work area may require drywall, trenching, or other non-electrical repair" : "",
    request.jobType === "Panel upgrade" ? "Utility coordination may be required" : "",
  ].filter(Boolean);

  const missingInfo = Object.entries(request.smartAnswers || {})
    .filter(([, value]) => !value)
    .map(([question]) => question.replace("Upload ", "Confirm uploaded "));

  if (!request.appointment) missingInfo.push("Preferred appointment window");
  if (!photoCount) missingInfo.push("Clear photos of the panel and work area");
  if (photoCount && !previewPhotos) missingInfo.push("Smaller photos that can be previewed in the admin review");

  const visiblePhotoObservations = mediaReviewSummary(request);

  const scope = scopeForJob(request.jobType, request);
  const laborRange = laborForJob(request.jobType, isEmergency);
  const materials = materialsForJob(request.jobType);
  const confidence = previewPhotos > 1 && missingInfo.length < 3 ? "Medium" : "Low";

  const customerQuoteDraft = `Hi ${request.customerName},\n\nThank you for contacting Alston Electric. Based on the information, photos, and videos submitted, your request appears to involve ${request.jobType.toLowerCase()} at ${request.address}.\n\nDraft scope: ${scope}\n\nEstimated price range: ${priceRange}\n\nThis is a draft estimate based on submitted information. Final pricing and scope require review by Alston Electric, site conditions, material availability, permit requirements, and professional verification by a licensed electrician before work begins.\n\nIf you would like to move forward, we can schedule the next step or request any additional photos needed to confirm the estimate.\n\nAlston Electric`;

  return {
    jobSummary: `${request.jobType} request for a ${request.propertyType.toLowerCase()} property. Urgency is ${request.urgency.toLowerCase()}. Admin can review ${previewPhotos} photo preview${previewPhotos === 1 ? "" : "s"}${previewVideos ? ` and ${previewVideos} video preview${previewVideos === 1 ? "" : "s"}` : ""} before approving the draft.`,
    customerRequestSummary: `${request.customerName} requested help with ${request.jobType.toLowerCase()} at ${request.address}. The customer described: ${request.description}`,
    visiblePhotoObservations,
    photoReviewChecklist: photoReviewChecklist(request.jobType),
    missingInfo: missingInfo.length ? missingInfo : ["Alston Electric should verify final site conditions before sending."],
    estimatedScope: scope,
    laborRange,
    priceRange,
    materials,
    riskFlags,
    confidence,
    customerQuoteDraft,
  };
}

function estimatePriceRange(request, pricing, isEmergency) {
  const map = {
    "EV charger installation": pricing.evChargerRange,
    "Panel upgrade": pricing.panelUpgradeRange,
    "Outlet installation": pricing.outletRange,
    "Switch installation": pricing.switchRange,
    "Lighting installation": pricing.lightingRange,
    "Recessed lighting": pricing.lightingRange,
    "Ceiling fan installation": pricing.ceilingFanRange,
    "Generator hookup": pricing.generatorRange,
  };
  const base = map[request.jobType] || `${pricing.minimumServiceCall}-${Number(pricing.minimumServiceCall) + Number(pricing.hourlyLaborRate) * 3}`;
  const [low, high] = String(base).split("-").map((part) => Number(part.trim()) || 0);
  const add = Number(pricing.travelFee) + (isEmergency ? Number(pricing.emergencyServiceFee) : 0);
  return `${money(low + add)} to ${money(high + add)}`;
}

function scopeForJob(jobType, request) {
  const scopes = {
    "EV charger installation": "Review panel capacity, confirm charger location, install compatible charging circuit if conditions allow, and verify safe operation after installation.",
    "Panel upgrade": "Inspect existing panel, verify service capacity, prepare upgrade scope, coordinate required permit or utility steps if needed, and replace equipment after approval.",
    "Lighting installation": "Review requested fixture locations, confirm wiring and access, install fixtures or lighting controls, and test operation.",
    "Outlet installation": "Confirm wiring access and GFCI requirements, install or replace outlets, and test operation.",
    "Switch installation": "Confirm wiring access and switching requirements, install or replace switches, and test operation.",
    "Ceiling fan installation": "Confirm ceiling box support and wiring, install customer-provided or approved fan, and test controls.",
    "Commercial electrical work": "Review the commercial work area, plans if available, code or permit needs, access requirements, and prepare a verified scope before scheduling.",
    "Electrical repair": "Troubleshoot the affected circuit or device, identify needed repair steps, and complete approved repairs once conditions are verified.",
  };
  return scopes[jobType] || `Review the submitted ${request.requestType.toLowerCase()} request, inspect the work area, and prepare a verified electrical scope for Alston Electric approval.`;
}

function laborForJob(jobType, isEmergency) {
  if (isEmergency) return "Requires urgent review before estimating";
  if (["Panel upgrade", "Generator hookup", "Commercial electrical work"].includes(jobType)) return "Full day or multi-day project";
  if (["EV charger installation", "Recessed lighting"].includes(jobType)) return "4-8 hours";
  if (["Lighting installation", "Ceiling fan installation"].includes(jobType)) return "2-4 hours";
  if (["Outlet installation", "Switch installation", "Electrical repair", "Breaker issue"].includes(jobType)) return "1-2 hours";
  return "Requires site visit before estimating";
}

function materialsForJob(jobType) {
  const common = {
    "EV charger installation": ["Breaker", "Circuit wiring", "Conduit or cable protection", "Mounting hardware", "Permitting allowance if required"],
    "Panel upgrade": ["Electrical panel", "Breakers", "Grounding and bonding materials", "Service conductors if required", "Permit allowance"],
    "Lighting installation": ["Light fixtures", "Electrical boxes", "Switch or dimmer", "Wire connectors", "Patch-ready materials if access is needed"],
    "Outlet installation": ["Outlet devices", "Electrical boxes", "Cover plates", "GFCI protection if required", "Circuit wiring"],
    "Switch installation": ["Switch devices", "Cover plates", "Electrical boxes", "Wire connectors"],
    "Ceiling fan installation": ["Fan-rated ceiling box", "Fan support hardware", "Switch or remote controls", "Wire connectors"],
    "Generator hookup": ["Transfer switch or interlock", "Breaker", "Inlet box", "Conduit", "Permit allowance"],
    "Commercial electrical work": ["Project-specific devices", "Commercial-grade materials", "Plans or permit documents if required"],
  };
  return common[jobType] || ["Diagnostic tools", "Approved replacement parts", "Wire connectors", "Cover plates or hardware as needed"];
}

function thankYouPage() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const id = params.get("id");
  return layout(`
    <main class="page">
      <section class="login-card">
        <h1>Request received</h1>
        <p class="lead">Thank you. Alston Electric will review the submitted details, photos, and videos before sending a professional response.</p>
        <p><strong>Request ID:</strong> ${escapeHtml(id || "Pending")}</p>
        <div class="button-row">
          <a class="primary-button" href="#/">Back to Home</a>
        </div>
      </section>
    </main>
  `);
}

function customerQuotePage() {
  const params = currentHashParams();
  const request = findRequest(params.get("id"));
  const company = getCompany();
  const bookingUrl = company.bookingUrl || appConfig.calcomBookingUrl || appConfig.caldiyBookingUrl;
  if (!request) {
    return layout(`<main class="page"><section class="login-card"><h1>Quote not found</h1><p class="lead">Please contact ${escapeHtml(company.name)} for a fresh quote link.</p></section></main>`);
  }
  const includedItems = request.ai.materials.length ? request.ai.materials : ["Labor and materials required to complete the approved scope."];
  const notIncludedItems = request.ai.riskFlags.length ? request.ai.riskFlags : ["Final pricing can change after on-site verification and material review."];
  const bookingUnlocked = ["Customer accepted", "Appointment requested", "Appointment confirmed", "Scheduled", "Booked"].includes(request.status);

  return layout(`
    <main class="page">
      <section class="customer-quote-hero">
        <div class="customer-quote-hero-copy">
          <span class="badge green">Customer quote</span>
          <h1>${escapeHtml(company.name)} estimate for ${escapeHtml(request.customerName)}</h1>
          <p>${escapeHtml(company.name)} reviewed the photos and details you shared and prepared this estimate for ${escapeHtml(request.address)}.</p>
          <div class="quote-highlights">
            <div><span>Job type</span><strong>${escapeHtml(request.jobType)}</strong></div>
            <div><span>Customer</span><strong>${escapeHtml(request.customerName)}</strong></div>
            <div><span>Expires</span><strong>${escapeHtml(quoteExpirationDate(request))}</strong></div>
          </div>
        </div>
        <div class="quote-total-card">
          <span>Estimated range</span>
          <strong>${escapeHtml(request.ai.priceRange)}</strong>
          ${statusBadge(request.status)}
        </div>
      </section>

      <section class="section grid grid-2 customer-quote-summary">
        <article class="card stack">
          <h2>Scope of work</h2>
          <p>${escapeHtml(request.ai.estimatedScope)}</p>
        </article>
        <article class="card stack">
          <h2>What is included</h2>
          <ul>${includedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </article>
        <article class="card stack">
          <h2>What is not included</h2>
          <ul>${notIncludedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </article>
        <article class="card stack">
          <h2>Quote disclaimer</h2>
          <p>${escapeHtml(company.quoteDisclaimer)}</p>
        </article>
      </section>

      ${request.photos?.length || request.videos?.length ? `
        <section class="section form-shell">
          <div class="section-heading-row">
            <div>
              <h2>Uploaded photos and videos</h2>
              <p class="muted">These are the files Alston Electric reviewed for this estimate.</p>
            </div>
            ${evidenceBadge(request)}
          </div>
          ${mediaGallery(request)}
        </section>
      ` : ""}

      <section class="section form-shell">
        <div class="section-heading-row">
          <div>
            <h2>Quote message</h2>
            <p class="muted">Review the estimate, then choose the next step that fits your project.</p>
          </div>
          ${statusBadge(request.status)}
        </div>
        <p class="quote-box">${escapeHtml(request.quoteMessage)}</p>
        <div class="button-stack customer-action-stack" style="margin-top:16px">
          <button class="primary-button" id="customer-approve">Accept estimate</button>
          <button class="ghost-button" id="show-question-form">Ask a question</button>
          <a class="ghost-button" href="#/upload-more?id=${encodeURIComponent(request.id)}">Upload more photos</a>
          <button class="danger-button" id="show-decline-form">Decline estimate</button>
          <a class="ghost-button" id="customer-pdf" href="${API_ENABLED ? `/api/quotes/${encodeURIComponent(request.id)}.pdf` : "#"}">Save quote as PDF</a>
        </div>
      </section>

      <form id="question-form" class="section form-shell hide">
        <h2>Ask a question</h2>
        <p class="muted">Send a note about the estimate and Alston Electric will review it.</p>
        <div class="field">
          <label for="customerQuestion">Your question</label>
          <textarea id="customerQuestion" name="customerQuestion" placeholder="Ask about the scope, price, schedule, or anything else."></textarea>
        </div>
        <button class="primary-button" type="submit" style="margin-top:16px">Send question</button>
      </form>

      <form id="decline-form" class="section form-shell hide">
        <h2>Decline estimate</h2>
        <p class="muted">Optional, but it helps Alston Electric learn what changed.</p>
        <div class="field">
          <label for="declineReason">Reason</label>
          <textarea id="declineReason" name="declineReason" placeholder="Tell us why this quote is not the right fit right now."></textarea>
        </div>
        <button class="danger-button" type="submit" style="margin-top:16px">Decline estimate</button>
      </form>

      <section class="section form-shell hide" id="customer-confirmation">
        <h2>Update received</h2>
        <p class="lead" id="customer-confirmation-text"></p>
        <div class="button-row">
          <a class="primary-button" href="#/customer/quote?id=${encodeURIComponent(request.id)}">Back to quote</a>
          <a class="ghost-button" href="#/upload-more?id=${encodeURIComponent(request.id)}">Upload more photos</a>
        </div>
      </section>

      <section class="section form-shell booking-shell ${bookingUnlocked ? "unlocked" : "locked"}">
        <div class="section-heading-row">
          <div>
            <h2>Book your appointment</h2>
            <p class="muted">${bookingUnlocked ? "Choose a time that works for you and Alston Electric will confirm the details." : "Accept the estimate first to unlock scheduling."}</p>
          </div>
          <span class="badge green">Appointment</span>
        </div>
        ${bookingUrl
          ? `
            <div class="booking-embed-shell">
              <iframe class="booking-embed" src="${escapeHtml(bookingUrl)}" title="Schedule your appointment with Alston Electric" loading="lazy" ${bookingUnlocked ? "" : 'tabindex="-1" aria-disabled="true"'}></iframe>
              ${bookingUnlocked ? "" : `
                <div class="booking-lock-overlay">
                  <strong>Accept the estimate to unlock booking</strong>
                  <p>Once you approve the quote, this scheduling view becomes active.</p>
                </div>
              `}
            </div>
          `
          : `
            <p class="muted">Set your Cal.com booking URL in company settings to enable online scheduling. Accept the estimate first, then the booking area will be ready to use.</p>
          `}
      </section>
    </main>
  `, "request");
}

function uploadMorePage() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const request = findRequest(params.get("id"));
  if (!request) {
    return layout(`<main class="page"><section class="login-card"><h1>Request not found</h1><p class="lead">Please contact Alston Electric for a fresh upload link.</p></section></main>`);
  }

  return layout(`
    <main class="page">
      <section class="section">
        <h1>Upload more photos</h1>
        <p class="lead">Add clearer photos or videos for ${escapeHtml(request.jobType.toLowerCase())} at ${escapeHtml(request.address)}.</p>
      </section>
      <section class="section card stack">
        <h2>Why we need more photos</h2>
        <p>${escapeHtml(request.photoRequest?.message || "We need a clearer view of the panel, work area, labels, and access path before we can finish the estimate.")}</p>
        <div class="grid grid-2">
          <p><strong>Requested by:</strong><br>${escapeHtml(request.photoRequest?.source || "Alston Electric")}</p>
        <p><strong>Requested on:</strong><br>${escapeHtml(request.photoRequest?.askedAt ? formatMonthDayYearTime(request.photoRequest.askedAt) : "Not recorded")}</p>
        </div>
        <p><strong>Focus areas:</strong><br>${escapeHtml((request.photoRequest?.checklist || photoReviewChecklist(request.jobType)).join(", "))}</p>
      </section>
      <form id="more-photos-form" class="form-shell">
        <div class="form-section">
          <h2>New media</h2>
          <div class="grid grid-2">
            ${uploadField("photos", "Additional photos", "image/*", true)}
            ${uploadField("videos", "Additional videos", "video/*", false)}
          </div>
        </div>
        <div class="form-section">
          <div class="field">
            <label for="photoNotes">Notes for Alston Electric</label>
            <textarea id="photoNotes" name="photoNotes" placeholder="Tell us what these photos show."></textarea>
          </div>
        </div>
        <div class="form-section">
          <button class="primary-button" type="submit">Submit additional photos</button>
        </div>
      </form>
    </main>
  `, "request");
}

function loginPage() {
  return layout(`
    <main class="page">
      <form id="login-form" class="login-card">
        <h1>Admin login</h1>
        <p class="lead">Private review area for Alston Electric. Demo password: <strong>alston</strong></p>
        ${field("password", "Password", "password", true)}
        <button class="primary-button" type="submit" style="margin-top:16px">Log In</button>
      </form>
    </main>
  `, "dashboard");
}

function bindLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = new FormData(form).get("password");
    if (password === "alston") {
      save(STORAGE_KEYS.auth, { loggedIn: true });
      setRoute("#/admin/dashboard");
    } else {
      alert("Use demo password: alston");
    }
  });
}

function bindCustomerQuote() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const id = params.get("id");
  const request = findRequest(id);
  const company = getCompany();
  if (!request) return;

  if (!request.quoteViewedAt) {
    updateStoredRequest(id, { quoteViewedAt: new Date().toISOString() }, "Customer viewed quote");
  }

  const hideAllFollowUpForms = () => {
    ["#question-form", "#decline-form"].forEach((selector) => document.querySelector(selector)?.classList.add("hide"));
    document.querySelector("#customer-confirmation")?.classList.add("hide");
  };

  const showConfirmation = (message) => {
    hideAllFollowUpForms();
    const confirmation = document.querySelector("#customer-confirmation");
    const confirmationText = document.querySelector("#customer-confirmation-text");
    if (confirmation && confirmationText) {
      confirmationText.textContent = message;
      confirmation.classList.remove("hide");
      confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  document.querySelector("#customer-approve")?.addEventListener("click", () => {
    updateStoredRequest(id, { status: "Customer accepted", acceptedAt: new Date().toISOString() }, "Customer accepted the estimate");
    document.querySelector(".booking-shell")?.classList.remove("locked");
    document.querySelector(".booking-shell")?.classList.add("unlocked");
    document.querySelector(".booking-lock-overlay")?.remove();
    const iframe = document.querySelector(".booking-embed");
    if (iframe) {
      iframe.removeAttribute("tabindex");
      iframe.removeAttribute("aria-disabled");
    }
    showConfirmation("Thank you. Alston Electric has received your approval. We will confirm scheduling and final details before work begins.");
  });
  document.querySelector("#show-question-form")?.addEventListener("click", () => {
    hideAllFollowUpForms();
    document.querySelector("#question-form")?.classList.remove("hide");
    document.querySelector("#question-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#show-decline-form")?.addEventListener("click", () => {
    hideAllFollowUpForms();
    document.querySelector("#decline-form")?.classList.remove("hide");
    document.querySelector("#decline-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#customer-pdf")?.addEventListener("click", (event) => {
    if (API_ENABLED) return;
    event.preventDefault();
    window.print();
  });
  document.querySelector("#question-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = String(new FormData(event.currentTarget).get("customerQuestion") || "").trim();
    updateStoredRequest(
      id,
      {
        status: "Customer question",
        customerQuestion: question,
      },
      question ? `Customer asked a question: ${question}` : "Customer asked a question",
    );
    showConfirmation("Your question has been sent to Alston Electric. They'll review it and respond soon.");
  });
  document.querySelector("#decline-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("declineReason") || "").trim();
    updateStoredRequest(
      id,
      {
        status: "Declined",
        declineReason: reason,
      },
      reason ? `Customer declined the estimate: ${reason}` : "Customer declined the estimate",
    );
    showConfirmation("We saved your response. Alston Electric appreciates the update.");
  });
}

function bindUploadMore() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const id = params.get("id");
  const form = document.querySelector("#more-photos-form");
  if (!form || !findRequest(id)) return;

  ["photos", "videos"].forEach((name) => bindMediaInputPreview(form, name));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Saving uploads...";
    try {
      const newPhotos = await buildMediaRecords(form.querySelector("#photos").files, "image");
      const newVideos = await buildMediaRecords(form.querySelector("#videos").files, "video");
      const notes = new FormData(form).get("photoNotes");
      updateStoredRequest(id, (request) => {
        const updated = {
          ...request,
          photos: [...(request.photos || []), ...newPhotos],
          videos: [...(request.videos || []), ...newVideos],
          status: "More photos received",
          additionalPhotoNotes: notes,
          photoRequest: {
            ...(request.photoRequest || {}),
            resolvedAt: new Date().toISOString(),
            resolver: "Customer upload",
            notes,
          },
        };
        updated.ai = generateAiDraft(updated);
        return updated;
      }, `Customer uploaded ${newPhotos.length} photo${newPhotos.length === 1 ? "" : "s"}${newVideos.length ? ` and ${newVideos.length} video${newVideos.length === 1 ? "" : "s"}` : ""}`);
      setRoute(`#/thank-you?id=${encodeURIComponent(id)}`);
    } catch (error) {
      alert(error.message || "The uploads could not be saved. Try fewer or smaller files.");
      submitButton.disabled = false;
      submitButton.textContent = "Submit additional photos";
    }
  });
}

function requireAuth() {
  const auth = load(STORAGE_KEYS.auth, { loggedIn: false });
  if (!auth.loggedIn) {
    setRoute("#/admin/login");
    return false;
  }
  return true;
}

function dashboardPage() {
  if (!requireAuth()) return "";
  const params = currentHashParams();
  const activeFilter = params.get("status") || "All";
  const requests = getRequests().filter((request) => requestMatchesStatusFilter(request.status, activeFilter));
  const allRequests = getRequests();
  return adminLayout(`
    <div class="toolbar">
      <div>
        <h1 class="tight">Estimate requests</h1>
        <p class="muted">Review AI drafts, update status, and prepare customer-ready quotes.</p>
      </div>
      <a class="primary-button" href="#/request">New Request</a>
    </div>
    <div class="filter-bar" aria-label="Request status filters">
      <a class="filter-chip ${activeFilter === "All" ? "active" : ""}" href="#/admin/dashboard">All <span>${allRequests.length}</span></a>
      ${dashboardStatusFilters.map((status) => {
        const count = allRequests.filter((request) => requestMatchesStatusFilter(request.status, status)).length;
        return `<a class="filter-chip ${activeFilter === status ? "active" : ""}" href="#/admin/dashboard?status=${encodeURIComponent(status)}">${escapeHtml(status)} <span>${count}</span></a>`;
      }).join("")}
    </div>
    <div class="request-list">
      ${requests.length ? requests.map((request) => requestListItem(request)).join("") : `<div class="empty-state"><h2>No requests match this filter.</h2><p class="muted">Try a different lifecycle status.</p></div>`}
    </div>
  `);
}

function requestListItem(request) {
  return `
    <article class="request-list-item">
      <div class="request-main">
        <div>
          <h2>${escapeHtml(request.customerName)}</h2>
          <p class="muted">${escapeHtml(request.phone)} | ${escapeHtml(request.email)}</p>
        </div>
        <a class="primary-button review-button" href="#/admin/request/${request.id}">Review</a>
      </div>
      <div class="request-summary">
        <span><strong>Job</strong>${escapeHtml(request.jobType)}</span>
        <span><strong>Address</strong>${escapeHtml(request.address)}</span>
        <span><strong>Submitted</strong>${formatMonthDayYear(request.submittedAt)}</span>
        <span><strong>Estimate</strong>${escapeHtml(request.ai.priceRange)}</span>
      </div>
      <div class="request-badges">
        ${urgencyBadge(request.urgency)}
        ${evidenceBadge(request)}
        <span class="badge ${request.ai.confidence === "Low" ? "orange" : "green"}">AI ${escapeHtml(request.ai.confidence)}</span>
        ${statusBadge(request.status)}
      </div>
    </article>
  `;
}

function urgencyBadge(urgency) {
  const className = urgency.includes("Emergency") || urgency === "Urgent" ? "red" : urgency === "Soon" ? "orange" : "";
  return `<span class="badge ${className}">${escapeHtml(urgency)}</span>`;
}

function statusBadge(status) {
  const lower = String(status || "").toLowerCase();
  const className = lower.includes("declined") || lower.includes("lost")
    ? "red"
    : lower.includes("received") || lower.includes("accepted") || lower.includes("completed") || lower.includes("scheduled") || lower.includes("booked") || lower.includes("confirmed") || lower.includes("approved")
      ? "green"
      : lower.includes("more") || lower.includes("visit") || lower.includes("question") || lower.includes("requested")
      ? "orange"
      : "";
  return `<span class="badge ${className}">${escapeHtml(status)}</span>`;
}

function evidenceBadge(request) {
  const previewable = previewableCount([...(request.photos || []), ...(request.videos || [])]);
  const total = (request.photos || []).length + (request.videos || []).length;
  const className = previewable ? "green" : total ? "orange" : "red";
  const label = previewable ? `${previewable}/${total} previewable` : total ? `${total} metadata only` : "No media";
  return `<span class="badge ${className}">${escapeHtml(label)}</span>`;
}

function smsHref(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  return `sms:${digits}?&body=${encodeURIComponent(message)}`;
}

function smsMessageForRequest(request, type = "quote") {
  const optOut = " Reply STOP to opt out.";
  if (type === "morePhotos") {
    return `Hi ${request.customerName}, please upload a few more photos here so Alston Electric can finish your estimate: ${morePhotosLink(request)}${optOut}`;
  }
  return `Hi ${request.customerName}, your Alston Electric estimate is ready to review: ${customerQuoteLink(request)}${optOut}`;
}

function smsStatusPanel(request) {
  const sms = request.lastSmsNotification;
  if (!sms) {
    return `
      <div class="sms-status-panel muted-panel">
        <strong>SMS status</strong>
        <span>No text message has been sent from this request yet.</span>
      </div>
    `;
  }

  const status = sms.deliveryStatus || (sms.accepted ? "accepted by Telnyx" : "failed");
  const isFailed = status.includes("failed") || sms.deliveryError || sms.error;
  return `
    <div class="sms-status-panel ${isFailed ? "failed" : "ok"}">
      <div>
        <strong>SMS status</strong>
        <span>${escapeHtml(status)}</span>
      </div>
      <dl>
        <div><dt>Provider</dt><dd>${escapeHtml(sms.provider || "telnyx")}</dd></div>
        <div><dt>To</dt><dd>${escapeHtml(sms.to || request.phone)}</dd></div>
        <div><dt>Message ID</dt><dd>${escapeHtml(sms.messageId || "Pending")}</dd></div>
        ${(sms.deliveryError || sms.error) ? `<div><dt>Reason</dt><dd>${escapeHtml(sms.deliveryError || sms.error)}</dd></div>` : ""}
      </dl>
    </div>
  `;
}

function photoRequestPanel(request) {
  const photoRequest = request.photoRequest;
  if (!photoRequest) return "";

  const checklist = photoRequest.checklist || photoReviewChecklist(request.jobType);
  const isResolved = Boolean(photoRequest.resolvedAt);
  return `
    <section class="section card stack photo-request-panel ${isResolved ? "resolved" : "pending"}">
      <div class="section-heading-row">
        <div>
          <h2>${isResolved ? "More photos request completed" : "More photos requested"}</h2>
          <p class="muted">${isResolved ? "The customer has already responded with an updated upload." : "This is the exact follow-up we sent so the customer knows what to capture next."}</p>
        </div>
        ${statusBadge(isResolved ? "Completed" : "More photos needed")}
      </div>
      <p class="photo-request-message">${escapeHtml(photoRequest.message || "Please upload clearer photos of the panel, labels, work area, and access path.")}</p>
      <div class="photo-request-grid">
        <p><strong>Requested by:</strong><br>${escapeHtml(photoRequest.source || "Alston Electric")}</p>
        <p><strong>Requested on:</strong><br>${escapeHtml(formatMonthDayYearTime(photoRequest.askedAt))}</p>
        <p><strong>Focus areas:</strong><br>${escapeHtml(checklist.join(", "))}</p>
        <p><strong>Upload link:</strong><br><span class="mono">${escapeHtml(morePhotosLink(request))}</span></p>
      </div>
      ${isResolved ? `
        <div class="photo-request-resolution">
          <p><strong>Resolved on:</strong> ${escapeHtml(formatMonthDayYearTime(photoRequest.resolvedAt))}</p>
          <p><strong>Resolved by:</strong> ${escapeHtml(photoRequest.resolver || "Not recorded")}</p>
          <p><strong>Customer notes:</strong> ${escapeHtml(photoRequest.notes || "No extra notes were added.")}</p>
        </div>
      ` : ""}
      <div class="button-row">
        <button class="small-button" id="copy-photo-request-message">Copy request text</button>
        <button class="small-button" id="copy-photo-request-link">Copy upload link</button>
        <a class="ghost-button" href="#/upload-more?id=${encodeURIComponent(request.id)}">Open upload page</a>
      </div>
    </section>
  `;
}

function workflowStep(title, description, state, extra = "") {
  return `
    <article class="workflow-step ${state}">
      <div class="workflow-step-top">
        <span class="workflow-dot"></span>
        <strong>${escapeHtml(title)}</strong>
      </div>
      <p>${escapeHtml(description)}</p>
      ${extra ? `<div class="workflow-step-extra">${extra}</div>` : ""}
    </article>
  `;
}

function detailsSection(id, title, summary, body, open = false) {
  return `
    <details class="details-card section" id="${id}" ${open ? "open" : ""}>
      <summary>
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p class="muted">${escapeHtml(summary)}</p>
        </div>
        <span class="details-hint">${open ? "Collapse" : "Expand"}</span>
      </summary>
      <div class="details-body">
        ${body}
      </div>
    </details>
  `;
}

function requestDetailPage(id) {
  if (!requireAuth()) return "";
  const request = getRequests().find((item) => item.id === id);
  if (!request) return adminLayout(`<div class="empty-state"><h1>Request not found</h1><a class="primary-button" href="#/admin/dashboard">Back to Dashboard</a></div>`);

  return adminLayout(`
    <div class="detail-header">
      <div>
        <h1 class="tight">${escapeHtml(request.customerName)}</h1>
        <p class="muted">${escapeHtml(request.jobType)} | ${escapeHtml(request.address)}</p>
      </div>
      <div class="button-row">
        <button class="small-button" id="copy-quote">Copy quote</button>
        <button class="small-button" id="print-quote">Print</button>
        <button class="primary-button" id="send-quote">Send quote</button>
      </div>
    </div>

    <section class="section workflow-strip">
      ${workflowStep("1. Review media", "Start with the photos and videos the customer uploaded.", "active", evidenceBadge(request))}
      ${workflowStep("2. Shape the quote", "Use the AI draft, checklist, and customer answers to tighten the estimate.", "pending", statusBadge(request.status))}
      ${workflowStep("3. Send the next step", "Approve the draft, request more photos, or move toward scheduling.", "pending", urgencyBadge(request.urgency))}
    </section>

    <section class="review-workbench">
      <div class="card media-review-panel">
        <div class="section-heading-row">
          <div>
            <h2>Uploaded photos and videos</h2>
            <p class="muted">Start here. Review the customer media before approving, requesting more photos, or scheduling a site visit.</p>
          </div>
          ${evidenceBadge(request)}
        </div>
        ${mediaGallery(request)}
      </div>
      <aside class="card review-decision-panel">
        <h2>Review decision</h2>
        <p>${statusBadge(request.status)} ${urgencyBadge(request.urgency)}</p>
        <h3>Photo checklist</h3>
        <ul class="compact-list">
          ${(request.ai.photoReviewChecklist || photoReviewChecklist(request.jobType)).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="decision-actions">
          <button class="primary-button review-action" data-status="Quote approved">Approve draft</button>
          <button class="ghost-button review-action" data-status="More photos needed">Need more photos</button>
          <button class="ghost-button review-action" data-status="Site visit needed">Site visit needed</button>
        </div>
        <div class="customer-workflow-actions">
          <h3>Customer workflow</h3>
          <a class="ghost-button" href="#/customer/quote?id=${encodeURIComponent(request.id)}">Open customer approval</a>
          <button class="ghost-button" id="copy-customer-link">Copy approval link</button>
          <button class="ghost-button sms-action" data-type="quote">Text quote link</button>
          <button class="ghost-button sms-action" data-type="morePhotos">Text more photos link</button>
          <button class="ghost-button" id="copy-sms-message">Copy SMS message</button>
          <a class="ghost-button" href="${API_ENABLED ? `/api/quotes/${encodeURIComponent(request.id)}.pdf` : `#/customer/quote?id=${request.id}`}">Download quote PDF</a>
        ${smsStatusPanel(request)}
      </div>
    </aside>
    </section>

    ${photoRequestPanel(request)}

    <section class="section grid grid-2 case-summary-grid">
      <section class="card stack">
        <h2>Case summary</h2>
        <div class="summary-grid">
          <p><strong>Customer:</strong><br>${escapeHtml(request.customerName)}</p>
          <p><strong>Job:</strong><br>${escapeHtml(request.jobType)}</p>
          <p><strong>Status:</strong><br>${statusBadge(request.status)} ${urgencyBadge(request.urgency)}</p>
          <p><strong>Media:</strong><br>${evidenceBadge(request)}</p>
        </div>
      </section>
      <section class="card stack">
        <h2>Appointment</h2>
        <div class="summary-grid">
          <p><strong>Appointment:</strong><br>${escapeHtml(request.appointment || "Not scheduled yet")}</p>
          <p><strong>Source:</strong><br>${escapeHtml(request.appointmentSource || "Not set")}</p>
          <p><strong>Requested date:</strong><br>${escapeHtml(request.appointmentRequest?.date || "Not provided")}</p>
          <p><strong>Requested window:</strong><br>${escapeHtml(request.appointmentRequest?.window || "Not provided")}</p>
        </div>
        <p><strong>Access notes:</strong><br>${escapeHtml(request.appointmentRequest?.notes || "No access notes provided.")}</p>
      </section>
    </section>

    ${detailsSection("customer-follow-up", "Customer follow-up", "What the customer has sent back since the quote went out.", `
      <div class="grid grid-2">
        <p><strong>Quote viewed:</strong><br>${escapeHtml(request.quoteViewedAt ? formatMonthDayYearTime(request.quoteViewedAt) : "Not yet recorded")}</p>
        <p><strong>Quote sent:</strong><br>${escapeHtml(request.quoteSentAt ? formatMonthDayYearTime(request.quoteSentAt) : "Not recorded")}</p>
        <p><strong>Accepted at:</strong><br>${escapeHtml(request.acceptedAt ? formatMonthDayYearTime(request.acceptedAt) : "Not accepted yet")}</p>
        <p><strong>Site visit request:</strong><br>${escapeHtml(request.siteVisitRequest?.requestedAt ? formatMonthDayYearTime(request.siteVisitRequest.requestedAt) : "Not requested")}</p>
        <p><strong>Customer question:</strong><br>${escapeHtml(request.customerQuestion || "No question submitted.")}</p>
        <p><strong>Decline reason:</strong><br>${escapeHtml(request.declineReason || "No decline reason recorded.")}</p>
      </div>
    `)}

    ${detailsSection("customer-answers", "Customer answers", "What the customer told us during intake.", `
      <p>${escapeHtml(request.description)}</p>
      <div class="grid grid-2">
        ${Object.entries(request.smartAnswers || {}).map(([question, answer]) => `<p><strong>${escapeHtml(question)}</strong><br>${escapeHtml(answer || "Not answered")}</p>`).join("")}
      </div>
    `)}

    ${detailsSection("ai-draft", "AI draft notes", "Suggested scope, price range, and flags used to shape the quote.", `
      <div class="grid grid-2">
        ${aiCard("AI-generated job summary", request.ai.jobSummary)}
        ${aiCard("Customer request summary", request.ai.customerRequestSummary)}
        ${aiCard("Photo evidence review", request.ai.visiblePhotoObservations)}
        ${aiListCard("Missing information", request.ai.missingInfo)}
        ${aiCard("Suggested scope", request.ai.estimatedScope)}
        ${aiCard("Suggested labor range", request.ai.laborRange)}
        ${aiCard("Suggested price range", request.ai.priceRange)}
        ${aiListCard("Materials checklist", request.ai.materials)}
        ${aiListCard("Risk flags", request.ai.riskFlags)}
      </div>
    `)}

    ${detailsSection("quote-draft", "Editable quote message", "Tighten the customer-facing estimate before sending.", `
      <div class="field">
        <label for="quoteMessage">Customer-friendly quote draft</label>
        <textarea id="quoteMessage" class="quote-box">${escapeHtml(request.quoteMessage)}</textarea>
      </div>
      <div class="button-row" style="margin-top:14px">
        <button class="primary-button" id="save-quote">Save quote</button>
        <a class="ghost-button" href="#/customer/quote?id=${request.id}">Preview customer view</a>
      </div>
    `)}

    ${detailsSection("follow-ups", "Customer follow-up messages", "Quick messages for next steps, reminders, or check-ins.", `
      <div class="grid grid-2">
        ${Object.entries(followUpTemplates).map(([key, message]) => `
          <article class="card">
            <h3>${escapeHtml(followUpTitle(key))}</h3>
            <p>${escapeHtml(message)}</p>
            <div class="button-row">
              <button class="small-button follow-copy" data-message="${escapeHtml(message)}">Copy</button>
              <button class="small-button follow-email" data-message="${escapeHtml(message)}">Email</button>
            </div>
          </article>
        `).join("")}
      </div>
    `)}

    ${detailsSection("internal-notes", "Internal notes", "Private notes and reminders for the office.", `
      <div class="field">
        <label for="notes">Private notes</label>
        <textarea id="notes">${escapeHtml(request.notes || "")}</textarea>
      </div>
      <button class="primary-button" id="save-notes" style="margin-top:14px">Save notes</button>
    `)}

    ${detailsSection("timeline", "Timeline", "A short history of what happened on this request.", `
      <div class="timeline">
        ${(request.timeline || []).map((item) => `<div class="timeline-item">${escapeHtml(item)}</div>`).join("")}
      </div>
    `)}
  `);
}

function followUpTitle(key) {
  return {
    first: "First follow-up",
    siteVisit: "Site visit follow-up",
    morePhotos: "More photos follow-up",
    closing: "Closing follow-up",
  }[key];
}

function mediaGallery(request) {
  const photos = request.photos || [];
  const videos = request.videos || [];
  const allMedia = [
    ...photos.map((file, index) => ({ ...file, kind: file.kind || "image", label: `Photo ${index + 1}` })),
    ...videos.map((file, index) => ({ ...file, kind: file.kind || "video", label: `Video ${index + 1}` })),
  ];

  if (!allMedia.length) {
    return `<div class="empty-state media-empty"><strong>No customer media uploaded yet.</strong><p>Ask for photos of the panel, labels, work area, and any visible damage before final review.</p></div>`;
  }

  return `
    <div class="media-summary">
      <span><strong>${photos.length}</strong> photo${photos.length === 1 ? "" : "s"}</span>
      <span><strong>${videos.length}</strong> video${videos.length === 1 ? "" : "s"}</span>
      <span><strong>${previewableCount(allMedia)}</strong> previewable locally</span>
    </div>
    <div class="media-grid">
      ${allMedia.map(mediaCard).join("")}
    </div>
  `;
}

function mediaCard(file) {
  const src = mediaSource(file);
  const status = file.previewStatus || (src ? "stored" : "metadata-only");
  const statusText = {
    stored: "Local preview stored",
    "too-large": "Metadata only - file was too large for this demo",
    unsupported: "Metadata only - unsupported file type",
    "metadata-only": "Metadata only - submitted before previews were enabled",
  }[status] || "Metadata only";
  const fileSize = `${Math.round((file.size || 0) / 1024)} KB`;
  const isVideo = (file.kind === "video" || (file.type || "").startsWith("video/"));
  const previewMarkup = src && isVideo
    ? `<video src="${escapeHtml(src)}" preload="metadata" muted playsinline></video>`
    : src
      ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(file.label || file.name)} preview" loading="lazy" />`
      : `<div class="media-placeholder"><strong>${escapeHtml(file.label || "Upload")}</strong><span>Preview unavailable</span></div>`;

  return `
    <article class="media-card">
      <button class="media-preview media-preview-button" type="button" ${src ? `data-media-lightbox="1" data-media-src="${escapeHtml(src)}" data-media-type="${escapeHtml(isVideo ? "video" : "image")}" data-media-title="${escapeHtml(file.label || "Upload")}" data-media-name="${escapeHtml(file.name || "Unnamed file")}" data-media-status="${escapeHtml(statusText)}" data-media-size="${escapeHtml(fileSize)}"` : "disabled"}>
        ${previewMarkup}
        ${src ? `<span class="media-open-hint">Open preview</span>` : `<span class="media-open-hint">No preview</span>`}
      </button>
      <div class="media-meta">
        <strong>${escapeHtml(file.label || "Upload")}</strong>
        <span>${escapeHtml(file.name || "Unnamed file")}</span>
        <span>${escapeHtml(file.type || "unknown type")} | ${fileSize}</span>
        <span class="media-status">${escapeHtml(statusText)}</span>
      </div>
    </article>
  `;
}

function bindMediaViewer() {
  const lightbox = document.querySelector("#media-lightbox");
  const media = document.querySelector("#media-lightbox-media");
  const caption = document.querySelector("#media-lightbox-caption");
  const close = () => {
    lightbox?.classList.add("hide");
    lightbox?.setAttribute("aria-hidden", "true");
    if (media) media.innerHTML = "";
    if (caption) caption.innerHTML = "";
  };

  document.querySelectorAll("[data-media-lightbox]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!lightbox || !media || !caption) return;
      const src = button.getAttribute("data-media-src") || "";
      const type = button.getAttribute("data-media-type") || "image";
      const title = button.getAttribute("data-media-title") || "Preview";
      const name = button.getAttribute("data-media-name") || "";
      const status = button.getAttribute("data-media-status") || "";
      const size = button.getAttribute("data-media-size") || "";
      media.innerHTML = type === "video"
        ? `<video src="${escapeHtml(src)}" controls autoplay playsinline></video>`
        : `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)} enlarged preview" />`;
      caption.innerHTML = `
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(name)}</span>
        <span>${escapeHtml(status)}${size ? ` | ${escapeHtml(size)}` : ""}</span>
      `;
      lightbox.classList.remove("hide");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });

  document.querySelector("#media-lightbox-close")?.addEventListener("click", close);
  document.querySelector("#media-lightbox-backdrop")?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  }, { once: true });
}

function aiCard(title, value) {
  return `<article class="card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(value)}</p></article>`;
}

function aiListCard(title, items = []) {
  return `<article class="card"><h3>${escapeHtml(title)}</h3><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`;
}

function bindRequestDetail(id) {
  const request = getRequests().find((item) => item.id === id);
  if (!request) return;

  const updateRequest = (changes, timelineMessage) => {
    const requests = getRequests().map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        ...changes,
        timeline: timelineMessage ? [...(item.timeline || []), timelineMessage] : item.timeline,
      };
    });
    save(STORAGE_KEYS.requests, requests);
    render();
  };

  document.querySelector("#status")?.addEventListener("change", (event) => {
    updateRequest({ status: event.target.value }, `Status changed to ${event.target.value}`);
  });
  document.querySelectorAll(".review-action").forEach((button) => {
    button.addEventListener("click", () => {
      const followUpMessage = button.dataset.status === "More photos needed"
        ? `We need a few more photos of the panel, work area, labels, and access path before we can finish the estimate.`
        : button.dataset.status === "Site visit needed"
          ? `We need to confirm the estimate on-site before finalizing price and scope.`
          : "";
      updateRequest({
        status: button.dataset.status,
        ...(button.dataset.status === "More photos needed"
          ? {
              photoRequest: {
                source: "Alston Electric",
                askedAt: new Date().toISOString(),
                message: followUpMessage,
                checklist: request.ai.photoReviewChecklist || photoReviewChecklist(request.jobType),
              },
            }
          : {}),
      }, `Review decision: ${button.textContent.trim()}`);
    });
  });
  document.querySelector("#copy-customer-link")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(customerQuoteLink(request));
    updateRequest({}, "Customer approval link copied");
    alert("Customer approval link copied.");
  });
  document.querySelector("#copy-sms-message")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(smsMessageForRequest(request, "quote"));
    updateRequest({}, "SMS message copied for manual send");
    alert("SMS message copied.");
  });
  document.querySelector("#copy-photo-request-message")?.addEventListener("click", async () => {
    const message = request.photoRequest?.message || smsMessageForRequest(request, "morePhotos");
    await navigator.clipboard.writeText(message);
    updateRequest({}, "More photos request copied");
    alert("Photo request text copied.");
  });
  document.querySelector("#copy-photo-request-link")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(morePhotosLink(request));
    updateRequest({}, "More photos link copied");
    alert("Upload link copied.");
  });
  document.querySelectorAll(".sms-action").forEach((button) => {
    button.addEventListener("click", async () => {
      const type = button.dataset.type || "quote";
      const message = smsMessageForRequest(request, type);

      if (!API_ENABLED) {
        window.location.href = smsHref(request.phone, message);
        return;
      }

      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "Sending...";
      try {
        const response = await fetch("/api/notifications/sms", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ requestId: request.id, type, message }),
        });
        if (!response.ok) throw new Error("SMS request failed.");
        const result = await response.json();
        if (!result.ok) throw new Error(result.error || "Telnyx did not accept the SMS.");
        alert(result.simulated ? "SMS simulated and logged." : `SMS sent to ${result.to}.`);
        await bootstrapBackendState();
        render();
      } catch (error) {
        alert(error.message || "SMS could not be sent.");
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });
  document.querySelector("#save-quote")?.addEventListener("click", () => {
    updateRequest({ quoteMessage: document.querySelector("#quoteMessage").value }, "Quote message edited");
  });
  document.querySelector("#save-notes")?.addEventListener("click", () => {
    updateRequest({ notes: document.querySelector("#notes").value }, "Internal notes updated");
  });
  document.querySelector("#copy-quote")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(document.querySelector("#quoteMessage").value);
    alert("Quote copied.");
  });
  document.querySelector("#print-quote")?.addEventListener("click", () => window.print());
  document.querySelector("#send-quote")?.addEventListener("click", () => {
    const quote = document.querySelector("#quoteMessage").value;
    updateRequest({ status: "Quote sent", quoteMessage: quote, quoteSentAt: new Date().toISOString() }, "Quote prepared for email sending");
    window.location.href = `mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent("Alston Electric estimate")}&body=${encodeURIComponent(quote)}`;
  });
  document.querySelectorAll(".follow-copy").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(button.dataset.message);
      updateRequest({}, `Follow-up copied: ${followUpTitleFromMessage(button.dataset.message)}`);
    });
  });
  document.querySelectorAll(".follow-email").forEach((button) => {
    button.addEventListener("click", () => {
      updateRequest({ status: "Quote sent" }, `Follow-up email prepared: ${followUpTitleFromMessage(button.dataset.message)}`);
      window.location.href = `mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent("Following up from Alston Electric")}&body=${encodeURIComponent(button.dataset.message)}`;
    });
  });
}

function followUpTitleFromMessage(message) {
  const match = Object.entries(followUpTemplates).find(([, template]) => template === message);
  return match ? followUpTitle(match[0]) : "Customer follow-up";
}

function settingsPage(kind) {
  if (!requireAuth()) return "";
  const isPricing = kind === "pricing";
  const values = isPricing ? getPricing() : getCompany();
  const title = isPricing ? "Pricing settings" : "Company settings";
  return adminLayout(`
    <div class="settings-layout">
      <aside class="settings-rail">
        <div class="settings-rail-card">
          <h2>${title}</h2>
          <p>${isPricing ? "Set the draft estimate numbers here." : "Follow the flow from business info to scheduling rules."}</p>
        </div>
        <nav class="settings-nav">
          ${isPricing
            ? `
              <a href="#pricing-basics">Pricing basics</a>
              <a href="#pricing-ranges">Price ranges</a>
            `
            : `
              <a href="#business-details">1. Business details</a>
              <a href="#contact-booking">2. Contact and booking</a>
              <a href="#policies">3. Customer policies</a>
              <a href="#blocked-times">4. Blocked times</a>
            `}
        </nav>
      </aside>

      <div class="settings-main">
        <form id="settings-form" class="form-shell">
          <h1>${title}</h1>
          <p class="lead">${isPricing ? "Control the ranges used by the AI draft estimator." : "Control the company details shown on quotes and public pages."}</p>
          ${isPricing
            ? `
              <section class="settings-section" id="pricing-basics">
                <h2>Pricing basics</h2>
                <div class="grid grid-2">
                  ${[
                    ["minimumServiceCall", "Minimum service call fee"],
                    ["hourlyLaborRate", "Hourly labor rate"],
                    ["emergencyServiceFee", "Emergency service fee"],
                    ["travelFee", "Travel fee"],
                    ["materialMarkup", "Material markup percentage"],
                    ["permitAllowance", "Permit allowance"],
                    ["diagnosticFee", "Diagnostic fee"],
                  ].map(([name, label]) => `
                    <div class="field">
                      <label for="${name}">${label}</label>
                      <input id="${name}" name="${name}" value="${escapeHtml(values[name])}" />
                    </div>
                  `).join("")}
                </div>
              </section>
              <section class="settings-section" id="pricing-ranges">
                <h2>Price ranges</h2>
                <div class="grid grid-2">
                  ${[
                    ["evChargerRange", "EV charger installation base range"],
                    ["panelUpgradeRange", "Panel upgrade base range"],
                    ["outletRange", "Outlet installation base range"],
                    ["switchRange", "Switch installation base range"],
                    ["lightingRange", "Lighting installation base range"],
                    ["ceilingFanRange", "Ceiling fan installation base range"],
                    ["generatorRange", "Generator hookup base range"],
                    ["commercialHourlyRate", "Commercial hourly rate"],
                    ["afterHoursRate", "After-hours rate"],
                    ["weekendRate", "Weekend rate"],
                  ].map(([name, label]) => `
                    <div class="field">
                      <label for="${name}">${label}</label>
                      <input id="${name}" name="${name}" value="${escapeHtml(values[name])}" />
                    </div>
                  `).join("")}
                </div>
              </section>
            `
            : `
              <section class="settings-section" id="business-details">
                <h2>1. Business details</h2>
                <p class="muted">What customers see first on quotes and public pages.</p>
                <div class="grid grid-2">
                  ${[
                    ["name", "Company name"],
                    ["logo", "Logo URL or file name"],
                    ["serviceArea", "Service area"],
                    ["businessHours", "Business hours"],
                  ].map(([name, label]) => `
                    <div class="field">
                      <label for="${name}">${label}</label>
                      <input id="${name}" name="${name}" value="${escapeHtml(values[name])}" />
                    </div>
                  `).join("")}
                </div>
              </section>

              <section class="settings-section" id="contact-booking">
                <h2>2. Contact and booking</h2>
                <p class="muted">How customers reach you and where they book time.</p>
                <div class="grid grid-2">
                  ${[
                    ["phone", "Phone number"],
                    ["email", "Email"],
                    ["website", "Website"],
                    ["bookingUrl", "Cal.com booking URL"],
                    ["address", "Business address"],
                    ["license", "License number if applicable"],
                  ].map(([name, label]) => `
                    <div class="field">
                      <label for="${name}">${label}</label>
                      <input id="${name}" name="${name}" value="${escapeHtml(values[name])}" />
                    </div>
                  `).join("")}
                </div>
              </section>

              <section class="settings-section" id="policies">
                <h2>3. Customer policies</h2>
                <p class="muted">The language customers see around safety, quotes, and terms.</p>
                <div class="grid grid-2">
                  ${[
                    ["emergencyMessage", "Emergency service message", true],
                    ["quoteDisclaimer", "Quote disclaimer", true],
                    ["standardTerms", "Standard terms", true],
                  ].map(([name, label]) => `
                    <div class="field field-wide">
                      <label for="${name}">${label}</label>
                      <textarea id="${name}" name="${name}">${escapeHtml(values[name])}</textarea>
                    </div>
                  `).join("")}
                </div>
              </section>
            `}
          <button class="primary-button" type="submit" style="margin-top:18px">Save settings</button>
        </form>
        ${!isPricing ? companyAvailabilitySection(values) : ""}
      </div>
    </div>
  `, kind);
}

function bindSettings(kind) {
  const form = document.querySelector("#settings-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (kind === "pricing") {
      save(STORAGE_KEYS.pricing, data);
    } else {
      const existing = getCompany();
      save(STORAGE_KEYS.company, { ...existing, ...data, scheduleBlocks: getScheduleBlocks(existing) });
    }
    alert("Settings saved.");
    render();
  });
}

function companyAvailabilitySection(company) {
  const blocks = getScheduleBlocks(company);
  return `
    <section class="section availability-section stack" id="blocked-times">
      <div class="section-heading-row">
        <div>
          <h2>Blocked appointment times</h2>
          <p class="muted">Use this for work trips, meetings, holidays, or other time that should not be offered for appointments.</p>
        </div>
      </div>
      <form id="availability-form" class="availability-form">
        <div class="grid grid-2">
          ${field("blockDate", "Date", "date", true)}
          ${selectField("blockWindow", "Time window", ["Morning", "Midday", "Afternoon", "After 5 PM", "All day"], true)}
        </div>
        <div class="field">
          <label for="blockReason">Reason</label>
          <input id="blockReason" name="blockReason" placeholder="Work schedule, meeting, vacation, or off-site job" />
        </div>
        <button class="primary-button" type="submit">Block this time</button>
      </form>
      ${blocks.length
        ? `
          <div class="availability-list">
            ${blocks.map((block, index) => `
              <article class="availability-item">
                <div>
                  <strong>${escapeHtml(formatScheduleBlock(block))}</strong>
                  <p class="muted">This time is hidden from the booking flow until removed.</p>
                </div>
                <button class="small-button unblock-button" data-index="${index}">Remove</button>
              </article>
            `).join("")}
          </div>`
        : `<p class="muted">No blocked times added yet.</p>`}
      <p class="muted">For live Cal.com booking, mirror these blocks in your Cal.com availability rules too.</p>
    </section>
  `;
}

function bindCompanyAvailability() {
  const form = document.querySelector("#availability-form");
  if (!form) return;

  const updateBlocks = (blocks) => {
    const company = getCompany();
    save(STORAGE_KEYS.company, { ...company, scheduleBlocks: blocks });
    render();
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const blockDate = String(formData.get("blockDate") || "");
    const blockWindow = String(formData.get("blockWindow") || "");
    const blockReason = String(formData.get("blockReason") || "").trim();
    if (!blockDate || !blockWindow) {
      alert("Pick a date and time window.");
      return;
    }
    const company = getCompany();
    const blocks = getScheduleBlocks(company);
    updateBlocks([
      ...blocks,
      {
        date: blockDate,
        window: blockWindow,
        reason: blockReason,
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  document.querySelectorAll(".unblock-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      if (!Number.isFinite(index)) return;
      const company = getCompany();
      const blocks = getScheduleBlocks(company);
      updateBlocks(blocks.filter((_, currentIndex) => currentIndex !== index));
    });
  });
}

function quotePreviewPage() {
  return customerQuotePage();
}

function seedRequests() {
  const request = {
    id: "AE-DEMO-1001",
    customerName: "Sample Customer",
    phone: "(555) 010-2200",
    email: "customer@example.com",
    address: "123 Example Drive",
    contactMethod: "Email",
    urgency: "Soon",
    jobType: "EV charger installation",
    propertyType: "Residential",
    requestType: "Installation",
    appointment: "Weekday afternoon",
    description: "I need a Level 2 EV charger installed in the garage. The panel is also in the garage about 25 feet away.",
    smartAnswers: {
      "What vehicle do you have?": "Ford F-150 Lightning",
      "Do you already have the charger?": "Yes",
      "Where do you want the charger installed?": "Right side garage wall",
      "Where is the electrical panel located?": "Garage",
      "About how far is the charger location from the panel?": "About 25 feet",
      "Is the panel in the garage, outside, basement, or utility room?": "Garage",
      "Do you know your panel amperage?": "200 amp",
      "Upload a photo of the panel.": "Included",
      "Upload a photo of the desired charger location.": "Included",
    },
    photos: [
      { name: "garage-panel.jpg", type: "image/jpeg", size: 245000, kind: "image", previewStatus: "stored", previewUrl: "assets/panel-upgrade-service.jpg" },
      { name: "charger-location.jpg", type: "image/webp", size: 192000, kind: "image", previewStatus: "stored", previewUrl: "assets/service-ev.png" },
    ],
    videos: [],
    submittedAt: new Date().toISOString(),
    status: "AI draft ready",
    notes: "Demo request. Replace with live submissions as customers use the form.",
    timeline: ["Request submitted", "AI draft generated for Alston Electric review"],
  };
  request.ai = generateAiDraft(request);
  request.quoteMessage = request.ai.customerQuoteDraft;
  return [request];
}

function render() {
  const hash = window.location.hash || "#/";
  const path = hash.split("?")[0];
  let html = "";
  let binder = () => {};

  if (path === "#/") html = homePage();
  else if (path === "#/request") {
    html = requestPage();
    binder = bindRequestForm;
  } else if (path === "#/thank-you") html = thankYouPage();
  else if (path === "#/customer/quote") {
    html = customerQuotePage();
    binder = bindCustomerQuote;
  } else if (path === "#/upload-more") {
    html = uploadMorePage();
    binder = bindUploadMore;
  } else if (path === "#/admin/login") {
    html = loginPage();
    binder = bindLogin;
  } else if (path === "#/admin/dashboard") html = dashboardPage();
  else if (path.startsWith("#/admin/request/")) {
    const id = path.replace("#/admin/request/", "");
    html = requestDetailPage(id);
    binder = () => bindRequestDetail(id);
  } else if (path === "#/admin/pricing") {
    html = settingsPage("pricing");
    binder = () => bindSettings("pricing");
  } else if (path === "#/admin/company") {
    html = settingsPage("company");
    binder = () => {
      bindSettings("company");
      bindCompanyAvailability();
    };
  } else if (path === "#/quote-preview") html = quotePreviewPage();
  else html = homePage();

  app.innerHTML = html;
  bindMediaViewer();
  binder();
}

window.addEventListener("hashchange", render);
bootstrapBackendState().then(render);
