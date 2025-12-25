require("dotenv").config();

const express = require("express");
const app = express();

const mongoose = require("mongoose");

app.use(express.json())


app.use("/api/v1/doctor", require("./routes/doctor.routes"))


const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then(res => {
        console.log("Connected to database done")
        app.listen(PORT, () => {
            console.log(`Server is running on: http://localhost:${PORT}`)
        })
    })
    .catch(err => {
        console.log("Error:", err.message)
    })
