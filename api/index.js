const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const allowedOrigins = [
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /\.repl\.co$/,
  /localhost/,
  /127\.0\.0\.1/,
];
if (process.env.ALLOWED_ORIGIN) {
  allowedOrigins.push(new RegExp(process.env.ALLOWED_ORIGIN.replace(/\./g, "\\.").replace(/\*/g, ".*")));
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((r) => r.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.get("/api/healthz", (req, res) => res.json({ status: "ok" }));

// --- MongoDB Connection ---
// Strip any accidental MONGODB_URI= prefix or surrounding quotes from the secret
const rawMongoUri = (process.env.MONGODB_URI || "")
  .replace(/^MONGODB_URI\s*=\s*/, "")
  .replace(/^["']|["']$/g, "")
  .trim();

const connectMongo = async () => {
  try {
    await mongoose.connect(rawMongoUri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};
connectMongo();

const waitForMongo = (timeoutMs = 20000) => {
  return new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) return resolve();
    const timer = setTimeout(() => reject(new Error("MongoDB not ready")), timeoutMs);
    mongoose.connection.once("open", () => { clearTimeout(timer); resolve(); });
    mongoose.connection.once("error", (err) => { clearTimeout(timer); reject(err); });
  });
};

// --- Service Schema ---
const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "bg-red-700" },
    img: { type: String, default: "" },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);

const DEFAULT_SERVICES = [
  { name: "NF", color: "bg-red-700", img: "/images/netmirror.jpg", active: true, order: 0 },
  { name: "Crunchy", color: "bg-orange-600", img: "/images/crunchyroll.png", active: true, order: 1 },
  { name: "YT Premium", color: "bg-red-600", img: "/images/youtube.png", active: true, order: 2 },
  { name: "Prime", color: "bg-sky-500", img: "/images/prime2.png", active: true, order: 3 },
];

mongoose.connection.once("open", async () => {
  const count = await Service.countDocuments();
  if (count === 0) {
    await Service.insertMany(DEFAULT_SERVICES);
    console.log("Default services seeded");
  }
});

// --- Real-time SSE clients ---
const sseClients = new Set();

const broadcastServices = async () => {
  if (sseClients.size === 0) return;
  try {
    const services = await Service.find().sort({ order: 1, createdAt: 1 });
    const payload = `data: ${JSON.stringify(services)}\n\n`;
    sseClients.forEach((client) => client.write(payload));
  } catch (err) {
    console.error("SSE broadcast error:", err.message);
  }
};

// --- Services API ---
app.get("/api/services/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.flushHeaders();
  sseClients.add(res);

  waitForMongo(20000)
    .then(() => Service.find().sort({ order: 1, createdAt: 1 }))
    .then((services) => res.write(`data: ${JSON.stringify(services)}\n\n`))
    .catch(() => {});

  req.on("close", () => sseClients.delete(res));
});

app.get("/api/services", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    await waitForMongo(20000);
    const services = await Service.find().sort({ order: 1, createdAt: 1 });
    res.json(services);
  } catch (err) {
    res.status(503).json({ error: "Database not ready, please retry" });
  }
});

app.post("/api/services", async (req, res) => {
  try {
    const { name, color, img } = req.body;
    const count = await Service.countDocuments();
    const service = new Service({ name, color, img, active: true, order: count });
    await service.save();
    res.json(service);
    broadcastServices();
  } catch (err) {
    res.status(500).json({ error: "Failed to add service" });
  }
});

app.patch("/api/services/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
    broadcastServices();
  } catch (err) {
    res.status(500).json({ error: "Failed to update service" });
  }
});

app.delete("/api/services/:id", async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
    broadcastServices();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service" });
  }
});

// --- Gmail API ---
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// --- Simple in-memory rate limiter ---
const rateLimitMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 1000;

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > RATE_WINDOW) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > RATE_LIMIT) {
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }
  next();
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const BLOCKED_CHARS = /[*\s\(\)\{\}\[\]\\\/\|<>!#$%^&=]/;

app.get("/api", rateLimit, async (req, res) => {
  const targetEmail = (req.query.to || "").trim();
  if (!targetEmail) return res.status(400).json({ error: "Target email is required" });
  if (!EMAIL_REGEX.test(targetEmail) || BLOCKED_CHARS.test(targetEmail)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
  try {
    const searchResponse = await gmail.users.messages.list({
      userId: "me",
      q: `to:${targetEmail}`,
      maxResults: 50,
    });
    const messages = searchResponse.data.messages;
    if (!messages || messages.length === 0) return res.json([]);
    const emailPromises = messages.map((msg) =>
      gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" })
    );
    const emailResponses = await Promise.all(emailPromises);
    const formattedEmails = emailResponses.map((response) => {
      const detail = response.data;
      const headers = detail.payload.headers;
      const getHeader = (name) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
      let body = "";
      if (detail.payload.parts) {
        const part =
          detail.payload.parts.find((p) => p.mimeType === "text/html") ||
          detail.payload.parts.find((p) => p.mimeType === "text/plain");
        if (part && part.body.data)
          body = Buffer.from(part.body.data, "base64").toString("utf8");
      } else if (detail.payload.body.data) {
        body = Buffer.from(detail.payload.body.data, "base64").toString("utf8");
      }
      return {
        id: detail.id,
        subject: getHeader("subject"),
        from: getHeader("from"),
        to: getHeader("to"),
        body,
        snippet: detail.snippet,
        timestamp: new Date(getHeader("date")),
        isRead: !detail.labelIds.includes("UNREAD"),
      };
    });
    res.json(formattedEmails);
  } catch (error) {
    console.error("Error fetching from Gmail API:", error);
    res.status(500).json({ error: "Failed to fetch emails from Gmail." });
  }
});

// --- Gift Card Scanner API ---
const cheerio = require("cheerio");
const SUDO_PASSWORD = process.env.SUDO_PASSWORD || "admin123";

app.post("/api/verify-password", (req, res) => {
  const { sudoPassword } = req.body;
  if (!sudoPassword || sudoPassword !== SUDO_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }
  res.json({ valid: true });
});

function getEmailBodyHtml(payload) {
  if (!payload) return "";
  const getPartBody = (part) => {
    if (part.mimeType === "text/html" && part.body && part.body.data) {
      return Buffer.from(part.body.data, "base64").toString("utf8");
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        const result = getPartBody(subPart);
        if (result) return result;
      }
    }
    return "";
  };
  if (payload.body && payload.body.data && payload.mimeType === "text/html") {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const body = getPartBody(part);
      if (body) return body;
    }
  }
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }
  return "";
}

function findAttachments(payload) {
  const attachments = [];
  const walk = (part) => {
    if (part.filename && part.body && part.body.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        attachmentId: part.body.attachmentId,
        sizeBytes: part.body.size || 0,
      });
    }
    if (part.parts) {
      for (const sub of part.parts) walk(sub);
    }
  };
  if (payload) walk(payload);
  return attachments;
}

function parseGiftCardFromHtml(html) {
  const $ = cheerio.load(html);
  const extractTableValue = (label) => {
    let found = "";
    $("td, th").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      const normalLabel = label.toLowerCase().trim();
      if (text.toLowerCase() === normalLabel) {
        const $row = $(el).closest("tr");
        const cells = $row.find("td, th");
        const elIndex = cells.index(el);
        if (elIndex >= 0 && elIndex < cells.length - 1) {
          const val = $(cells[elIndex + 1]).text().trim();
          if (val) {
            found = val;
            return false;
          }
        }
      }
    });
    return found;
  };
  const brand = extractTableValue("Brand");
  const value = extractTableValue("E-gift card value") || extractTableValue("Gift card value") || extractTableValue("Value");
  const code = extractTableValue("Code");
  const validity = extractTableValue("Validity");
  if (!brand && !code && !value) return null;
  return { brand, value, code, validity };
}

function toISTString(epochMs) {
  const date = new Date(epochMs);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

app.post("/api/gift-scan", async (req, res) => {
  const { sudoPassword, senderEmail, startTimeIST } = req.body;
  if (!sudoPassword || sudoPassword !== SUDO_PASSWORD) {
    return res.status(401).json({ error: "Invalid sudo password" });
  }
  if (!senderEmail || !startTimeIST) {
    return res.status(400).json({ error: "Missing senderEmail or startTimeIST" });
  }

  const startDate = new Date(startTimeIST);
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ error: "Invalid startTimeIST format" });
  }

  const afterEpochSeconds = Math.floor(startDate.getTime() / 1000);
  const query = `from:${senderEmail} after:${afterEpochSeconds}`;
  console.log("[gift-scan] Query:", query);

  try {
    let allMessages = [];
    let pageToken = undefined;
    do {
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 200,
        pageToken,
      });
      const messages = listResponse.data.messages || [];
      allMessages = allMessages.concat(messages);
      pageToken = listResponse.data.nextPageToken;
    } while (pageToken);

    console.log("[gift-scan] Found", allMessages.length, "messages");
    if (allMessages.length === 0) {
      return res.json({ totalFound: 0, byValue: {} });
    }

    const batchSize = 20;
    const byValue = {};
    let totalFound = 0;

    for (let i = 0; i < allMessages.length; i += batchSize) {
      const batch = allMessages.slice(i, i + batchSize);
      const emailPromises = batch.map((msg) =>
        gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" })
      );
      const emailResponses = await Promise.all(emailPromises);

      for (const response of emailResponses) {
        const detail = response.data;
        const internalDate = parseInt(detail.internalDate || "0", 10);
        const receivedAt = toISTString(internalDate);
        const html = getEmailBodyHtml(detail.payload);
        const parsed = parseGiftCardFromHtml(html);
        if (!parsed || !parsed.code) continue;

        const { brand, value, code, validity } = parsed;
        const attachmentInfos = findAttachments(detail.payload);
        const attachments = [];

        for (const att of attachmentInfos) {
          try {
            const attResponse = await gmail.users.messages.attachments.get({
              userId: "me",
              messageId: detail.id,
              id: att.attachmentId,
            });
            const rawData = attResponse.data.data || "";
            const standardBase64 = rawData.replace(/-/g, "+").replace(/_/g, "/");
            attachments.push({
              filename: att.filename,
              mimeType: att.mimeType,
              base64Data: standardBase64,
              sizeBytes: att.sizeBytes,
            });
          } catch (attErr) {
            console.warn("[gift-scan] Failed to fetch attachment:", att.filename);
          }
        }

        const sheetKey = value || "Unknown";
        if (!byValue[sheetKey]) byValue[sheetKey] = [];
        byValue[sheetKey].push({ brand, value, code, validity, receivedAt, attachments });
        totalFound++;
      }
    }

    console.log("[gift-scan] Total found:", totalFound);
    res.json({ totalFound, byValue });
  } catch (err) {
    console.error("[gift-scan] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to scan Gmail" });
  }
});

// --- Razorpay Refund Scanner ---
function parseRazorpayRefundHtml(html, toEmail) {
  const $ = cheerio.load(html);

  const getText = (label) => {
    let found = "";
    $("td, th, p, span, div").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (text.toLowerCase() === label.toLowerCase()) {
        const $row = $(el).closest("tr");
        if ($row.length) {
          const cells = $row.find("td");
          const idx = cells.index(el);
          if (idx >= 0 && idx < cells.length - 1) {
            const val = $(cells[idx + 1]).text().trim().replace(/\s+/g, " ");
            if (val) { found = val; return false; }
          }
        }
        const $next = $(el).next();
        if ($next.length) {
          const val = $next.text().trim().replace(/\s+/g, " ");
          if (val) { found = val; return false; }
        }
      }
    });
    return found;
  };

  // Extract RRN from prominent heading (large number in email)
  let rrn = "";
  $("td, div, p, span").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, "");
    if (/^\d{10,15}$/.test(text)) {
      rrn = text;
      return false;
    }
  });

  // Also try to find RRN from "RRN for Refund ID" line
  if (!rrn) {
    $("*").each((_, el) => {
      const text = $(el).clone().children().remove().end().text().trim();
      const match = text.match(/RRN[^\d]*(\d{8,15})/i);
      if (match) { rrn = match[1]; return false; }
    });
  }

  const refundId = getText("Refund Id") || getText("Refund ID") || getText("Refund id");
  const refundAmount = getText("Refund Amount") || getText("Refund amount");
  const initiatedOn = getText("Initiated On") || getText("Initiated on");
  const paymentAmount = getText("Payment Amount") || getText("Payment amount");
  const paymentId = getText("Payment Id") || getText("Payment ID");

  // Payment Via can be multi-line (UPI VPA + "Upi")
  let paymentVia = getText("Payment Via") || getText("Payment via");
  if (!paymentVia) {
    $("td").each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text === "payment via") {
        const $row = $(el).closest("tr");
        const nextCell = $row.find("td").eq(1);
        if (nextCell.length) {
          paymentVia = nextCell.text().trim().replace(/\s+/g, " ");
          return false;
        }
      }
    });
  }

  // Mobile Number
  let mobileNumber = getText("Mobile Number") || getText("Mobile number") || getText("Phone");
  if (!mobileNumber) {
    const fullText = $.text();
    const mobileMatch = fullText.match(/(\+91[\s-]?\d{10}|\d{10})/);
    if (mobileMatch) mobileNumber = mobileMatch[1];
  }

  // Email — from "to" header passed in, or extract from body
  let email = toEmail || "";
  if (!email) {
    const fullText = $.text();
    const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
  }

  if (!refundId && !rrn && !refundAmount) return null;

  // Detect status: "successful" if body/subject mentions it, otherwise "initiated"
  const status = /refund\s+(was\s+)?success(ful(ly)?)?|successfully\s+processed/i.test(bodyText)
    ? "successful"
    : "initiated";

  return { rrn, refundAmount, refundId, initiatedOn, paymentAmount, paymentId, paymentVia, mobileNumber, email, status };
}

function parseRazorpayPaymentHtml(html, toEmail) {
  const $ = cheerio.load(html);
  const bodyText = $.text().replace(/\s+/g, " ");

  // Must contain "Paid Successfully" to be a payment confirmation
  if (!/paid\s+successfully/i.test(bodyText)) return null;

  const getText = (label) => {
    let found = "";
    $("td, th, p, span, div").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (text.toLowerCase() === label.toLowerCase()) {
        const $row = $(el).closest("tr");
        if ($row.length) {
          const cells = $row.find("td");
          const idx = cells.index(el);
          if (idx >= 0 && idx < cells.length - 1) {
            const val = $(cells[idx + 1]).text().trim().replace(/\s+/g, " ");
            if (val) { found = val; return false; }
          }
        }
        const $next = $(el).next();
        if ($next.length) {
          const val = $next.text().trim().replace(/\s+/g, " ");
          if (val) { found = val; return false; }
        }
      }
    });
    return found;
  };

  // Payment ID
  const paymentId = getText("Payment Id") || getText("Payment ID") || getText("Payment id");

  // Method (UPI VPA etc)
  const method = getText("Method") || getText("Payment Method") || getText("method");

  // Paid On
  const paidOn = getText("Paid On") || getText("paid on") || getText("Date");

  // Amount — look for prominent ₹ amount
  let amount = "";
  $("td, div, p, span, h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    const match = text.match(/^₹\s*[\d,]+(?:\.\d{1,2})?$/);
    if (match) { amount = text; return false; }
  });
  if (!amount) {
    const m = bodyText.match(/₹\s*([\d,]+(?:\.\d{1,2})?)/);
    if (m) amount = "₹" + m[1];
  }

  // Merchant name — often the first prominent text / heading in the email
  let merchant = "";
  $("h1, h2, h3, td[style*='font-size:20'], td[style*='font-size: 20']").each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g, " ");
    if (t && !/paid\s+successfully/i.test(t) && !/₹/.test(t) && t.length < 80) {
      merchant = t; return false;
    }
  });

  // Mobile
  let mobileNumber = getText("Mobile Number") || getText("Mobile") || "";
  if (!mobileNumber) {
    const m = bodyText.match(/(\+91[\s-]?\d{10}|\d{10})/);
    if (m) mobileNumber = m[1];
  }

  // Email
  let email = getText("Email") || getText("email") || toEmail || "";

  if (!paymentId && !amount) return null;

  return { type: "payment", merchant, amount, paymentId, method, paidOn, email, mobileNumber };
}

app.post("/api/razorpay-scan", async (req, res) => {
  const { sudoPassword, startTimeIST } = req.body;
  if (!sudoPassword || sudoPassword !== SUDO_PASSWORD) {
    return res.status(401).json({ error: "Invalid sudo password" });
  }
  if (!startTimeIST) {
    return res.status(400).json({ error: "Missing startTimeIST" });
  }

  const startDate = new Date(startTimeIST);
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ error: "Invalid startTimeIST format" });
  }

  const afterEpochSeconds = Math.floor(startDate.getTime() / 1000);
  const query = `from:no-reply@razorpay.com after:${afterEpochSeconds}`;
  console.log("[razorpay-scan] Query:", query);

  try {
    let allMessages = [];
    let pageToken = undefined;
    do {
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 200,
        pageToken,
      });
      const messages = listResponse.data.messages || [];
      allMessages = allMessages.concat(messages);
      pageToken = listResponse.data.nextPageToken;
    } while (pageToken);

    console.log("[razorpay-scan] Found", allMessages.length, "messages");
    if (allMessages.length === 0) return res.json({ totalFound: 0, refunds: [], payments: [] });

    const batchSize = 20;
    const refunds = [];
    const payments = [];

    for (let i = 0; i < allMessages.length; i += batchSize) {
      const batch = allMessages.slice(i, i + batchSize);
      const emailResponses = await Promise.all(
        batch.map((msg) => gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" }))
      );

      for (const response of emailResponses) {
        const detail = response.data;
        const internalDate = parseInt(detail.internalDate || "0", 10);
        const receivedAt = toISTString(internalDate);
        const headers = detail.payload.headers || [];
        const getHeader = (name) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
        const toEmail = getHeader("to");
        const subject = getHeader("subject");
        const html = getEmailBodyHtml(detail.payload);

        // Try payment confirmation parser first
        const payment = parseRazorpayPaymentHtml(html, toEmail);
        if (payment) {
          payments.push({ ...payment, subject, receivedAt });
          continue;
        }

        // Then try refund/RRN parser
        const refund = parseRazorpayRefundHtml(html, toEmail);
        if (refund) {
          refunds.push({ ...refund, subject, receivedAt });
        }
      }
    }

    // ── O(n) deduplication by refundId ──────────────────────────────────────
    // Map<refundId, { row, count }>  — single pass, optimal for 100K+ records
    const refundMap = new Map();
    for (const row of refunds) {
      const key = row.refundId || row.rrn || `${row.paymentId}_${row.refundAmount}`;
      if (!refundMap.has(key)) {
        refundMap.set(key, { row, count: 1 });
      } else {
        const entry = refundMap.get(key);
        entry.count++;
        // Prefer the "successful" record over "initiated"
        if (row.status === "successful" && entry.row.status !== "successful") {
          entry.row = row;
        }
      }
    }

    const deduplicatedRefunds = [];  // all resolved records (sheet 1)
    const pendingRefunds = [];       // appeared exactly once — no "successful" counterpart yet (sheet 2)
    for (const { row, count } of refundMap.values()) {
      deduplicatedRefunds.push(row);
      if (count === 1) pendingRefunds.push(row);
    }

    const duplicatesRemoved = refunds.length - deduplicatedRefunds.length;
    console.log(
      `[razorpay-scan] Refunds raw=${refunds.length} deduped=${deduplicatedRefunds.length}`,
      `removed=${duplicatesRemoved} pending=${pendingRefunds.length} Payments=${payments.length}`
    );
    res.json({
      totalFound: deduplicatedRefunds.length + payments.length,
      refunds: deduplicatedRefunds,
      pendingRefunds,
      duplicatesRemoved,
      payments,
    });
  } catch (err) {
    console.error("[razorpay-scan] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to scan Gmail" });
  }
});

// --- JioGames Order PDF Scanner ---
app.post("/api/jiogames-scan", async (req, res) => {
  const { sudoPassword, startTimeIST } = req.body;
  if (!sudoPassword || sudoPassword !== SUDO_PASSWORD) {
    return res.status(401).json({ error: "Invalid sudo password" });
  }
  if (!startTimeIST) {
    return res.status(400).json({ error: "Missing startTimeIST" });
  }

  const startDate = new Date(startTimeIST);
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({ error: "Invalid startTimeIST format" });
  }

  const afterEpochSeconds = Math.floor(startDate.getTime() / 1000);
  const query = `from:orders@jiogames.com after:${afterEpochSeconds}`;
  console.log("[jiogames-scan] Query:", query);

  try {
    let allMessages = [];
    let pageToken = undefined;
    do {
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 200,
        pageToken,
      });
      const messages = listResponse.data.messages || [];
      allMessages = allMessages.concat(messages);
      pageToken = listResponse.data.nextPageToken;
    } while (pageToken);

    console.log("[jiogames-scan] Found", allMessages.length, "messages");
    if (allMessages.length === 0) return res.json({ totalFound: 0, orders: [] });

    const batchSize = 20;
    const orders = [];

    for (let i = 0; i < allMessages.length; i += batchSize) {
      const batch = allMessages.slice(i, i + batchSize);
      const emailResponses = await Promise.all(
        batch.map((msg) => gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" }))
      );

      for (const response of emailResponses) {
        const detail = response.data;
        const internalDate = parseInt(detail.internalDate || "0", 10);
        const receivedAt = toISTString(internalDate);
        const headers = detail.payload.headers || [];
        const getHeader = (name) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
        const subject = getHeader("subject");
        const toEmail = getHeader("to");

        // Collect all attachments (especially PDFs)
        const attachmentInfos = findAttachments(detail.payload);
        const attachments = [];

        for (const att of attachmentInfos) {
          try {
            const attResponse = await gmail.users.messages.attachments.get({
              userId: "me",
              messageId: detail.id,
              id: att.attachmentId,
            });
            const rawData = attResponse.data.data || "";
            const standardBase64 = rawData.replace(/-/g, "+").replace(/_/g, "/");
            attachments.push({
              filename: att.filename,
              mimeType: att.mimeType,
              base64Data: standardBase64,
              sizeBytes: att.sizeBytes,
            });
          } catch (attErr) {
            console.warn("[jiogames-scan] Failed to fetch attachment:", att.filename);
          }
        }

        // Also try to extract any inline data from HTML body
        const html = getEmailBodyHtml(detail.payload);
        const $ = cheerio.load(html);

        // Try to extract game name / order details from the email body
        let gameName = "";
        let orderId = "";
        let amount = "";

        // Common patterns in JioGames order emails
        const bodyText = $.text().replace(/\s+/g, " ");
        const orderMatch = bodyText.match(/order\s*(?:id|no|number)[:\s#]*([A-Z0-9\-]+)/i);
        if (orderMatch) orderId = orderMatch[1];
        const amountMatch = bodyText.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
        if (amountMatch) amount = "₹" + amountMatch[1];

        // Try to get game name from subject
        const subjectClean = subject.replace(/order\s*confirm(?:ation)?/gi, "").replace(/jiogames/gi, "").trim();
        gameName = subjectClean || subject;

        orders.push({ subject, gameName, orderId, amount, toEmail, receivedAt, attachments });
      }
    }

    console.log("[jiogames-scan] Total orders:", orders.length);
    // Sort newest first
    orders.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    res.json({ totalFound: orders.length, orders });
  } catch (err) {
    console.error("[jiogames-scan] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to scan Gmail" });
  }
});

// --- Serve Frontend Static Files (Production) ---
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

// --- Start Server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
