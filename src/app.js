require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const app = express();

const mongoose = require("mongoose");

// use Morgan
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// use the Cookies
const cookies = require("cookie-parser");
app.use(cookies());

// protect from xss
const xssSanitize = require("./middlewares/xss.middleware");
app.use(xssSanitize);

// use helmet for Enhanced security headers specifically for auth
const helmet = require("helmet");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
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

// use the CORS
const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:5167"],
  })
);

// Rate Limiter import from middleware limiter
const { apiLimiter } = require("./middlewares/limiter.middleware");
app.use(apiLimiter);

app.use("/api/v1/doctor", require("./routes/doctor.routes"));

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
