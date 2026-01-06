require("dotenv").config();
const jwt = require("jsonwebtoken");

class TokenService {
    genrateAccessToken(payload) {
        return jwt.sign(
            {
                ...payload,
                type: "access"
            },
            process.env.SECRET_ACCESS_TOKEN_KEY,
            {
                expiresIn: "15m",
            }
        );
    }

    genrateRefreshToken(payload) {
        return jwt.sign(
            {
                ...payload,
                type: "refresh"
            },
            process.env.SECRET_REFRESH_TOKEN_KEY,
            {
                expiresIn: "7d",
            }
        );
    }

    verifyAccessToken(token) {
        try {
            return jwt.verify(token, process.env.SECRET_ACCESS_TOKEN_KEY)
        } catch (error) {
            if(error.name === "TokenExpiredError") {
                throw new Error("Access Token Expired");
            }

            if(error.name === "JsonWebTokenError") {
                throw new Error("Invalid Access Token");
            }

            throw new Error("Token Verification Failed")
        }
    }


    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.SECRET_REFRESH_TOKEN_KEY)
        } catch (error) {
            if(error.name === "TokenExpiredError") {
                throw new Error("Refresh Token Expired");
            }

            if(error.name === "JsonWebTokenError") {
                throw new Error("Invalid Refresh Token");
            }

            throw new Error("Token Verification Faild")
        }
    }
}

module.exports = new TokenService();