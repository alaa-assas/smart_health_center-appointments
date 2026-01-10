const mongoose = require("mongoose");
require("dotenv").config();


const connectDB = () => {
    const MONGO_URL = process.env.MONGO_URL;
    
    mongoose.connect(MONGO_URL)
        .then(res => {
            console.log("Connected to database done")
        })
        .catch(err => {
            console.log("Error:", err.message)
        })
}

module.exports = connectDB;