const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

// --- Services API ---
app.get("/api/services", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    const services = await Service.find().sort({ order: 1, createdAt: 1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

app.post("/api/services", async (req, res) => {
  try {
    const { name, color, img } = req.body;
    const count = await Service.countDocuments();
    const service = new Service({ name, color, img, active: true, order: count });
    await service.save();
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: "Failed to add service" });
  }
});

app.patch("/api/services/:id", async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ error: "Service not found" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: "Failed to update service" });
  }
});

app.delete("/api/services/:id", async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
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

app.get("/api", async (req, res) => {
  const targetEmail = req.query.to;
  if (!targetEmail) return res.status(400).json({ error: "Target email is required" });
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

// --- Serve Frontend Static Files (Production) ---
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
