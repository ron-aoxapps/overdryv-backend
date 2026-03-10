

// const app = express();
// const PORT = process.env.PORT || 4000;


// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://hrrxmgf8-4000.inc1.devtunnels.ms",
// ];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
//     credentials: true,
//   }),
// );
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use("/files", express.static(path.join(__dirname, "public/files")));

// app.get("/", (req, res) => {
//   res.json({ message: "Welcome to the Node.js API" });
// });

// app.use("/api/v1", routes);

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });








// import rateLimit from "express-rate-limit";
// import helmet from "helmet";




const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const allRoutes = require("./routes/index");
const path = require("path");
require("dotenv").config();
const http = require("http");

// initFirebase();

const PORT = process.env.PORT || 4000;
const app = express();
// bindFirebaseToApp(app);

const server = http.createServer(app);

// const io = initSocket(server, allowedOrigins);
// app.set("io", io);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

// app.use('/webhook', express.raw({ type: 'application/json' , verify: (req, res, buf) => {req.rawBody = buf;} }), handleStripeWebhook);

// app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  "https://h65zmng5-5173.inc1.devtunnels.ms",
  "https://overdryv.app",
  "https://*.overdryv.app",
  "https://hrrxmgf8-4000.inc1.devtunnels.ms"
];

app.use(
  cors({
    origin: function (origin, callback) {

      if (!origin) return callback(null, true); // allow server-to-server or Postman

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".overdryv.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: "Too many requests, try again later.",
// });
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });
// app.use("/api/", limiter);

// setupSocket(io);

app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully on Railway!");
});

app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  let tokenPayload = null;

  console.log("===================================================");

  console.log("📌 API Request Log:");
  console.log("➡️ Endpoint:", req.method, req.originalUrl);
  console.log("🔑 Token Payload:", authHeader);

  next();
});

app.use("/api/v1", allRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error",
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on PORT ${PORT}`);
});
