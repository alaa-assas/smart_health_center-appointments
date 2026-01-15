const mongoose = require("mongoose");

const UrlToken = mongoose.model("UrlToken", new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
}))

module.exports = UrlToken;