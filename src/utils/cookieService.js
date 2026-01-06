const cookieConfig = {
    httpOnly: true, // http
    secure: false, // https
    sameSite: "strict" 
}

class CookieService {
    setAccessToken(res, token) {
        res.cookie("accessToken", token, {
            ...cookieConfig,
            maxAge: 15 * 60 * 1000 // 15m
        });
    }

    setRefreshToken(res, token) {
        res.cookie("refreshToken", token, {
            ...cookieConfig,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
        });
    }

    clearTokens(res) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
    }

    getAccessToken(req) {
        return req.cookies.accessToken;
    }

    getRefreshToken(req) {
        return req.cookies.refreshToken;
    }
}

module.exports = new CookieService();