require("dotenv").config();

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const { apiLimiter } = require("./middlewares/limiter.middleware");

const helmet = require("helmet");
const xssSanitize = require("./middlewares/xss.middleware");

app.use(express.json());
app.use(cookies());
// protect from xss
app.use(xssSanitize);

// Enhanced security headers specifically for auth
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        /* styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], */
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        /* connectSrc: ["'self'", "https://api.yourdomain.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"], */
        frameAncestors: ["'none'"], // Prevent clickjacking
        formAction: ["'self'"], // Restrict form submissions
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// Rate Limiter
app.use(apiLimiter);

/** start routes **/
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1/doctor", require("./routes/doctor.routes"));
app.use("/api/v1/review", require("./routes/review.routes"));
app.use("/api/v1/specialty", require("./routes/specialty.routes"));

     //patients
app.use("/api/v1/patients", require("./routes/patient.routes"));

/** end routes **/

// Error Middleware
app.use(require("./middlewares/error.middleware"));

// Not Found
app.use(require("./middlewares/notfound.middleware"));

const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then((res) => {
    console.log("Connected to database done");
    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error:", err.message);
  });
