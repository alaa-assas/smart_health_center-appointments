const socketIO = require("socket.io");
const User = require("../models/User");
const cookie = require("cookie");
const tokenService = require("../utils/tokenService");

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Authenticate user on WebSocket connection using access token from cookies
  io.use(async (socket, next) => {
    try {
      // Pull cookies from the initial handshake request
       const cookieHeader = socket.request.headers.cookie;

       if (!cookieHeader) {
        return next(new Error("Authentication error: No cookies found"));
      }

      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken; 

      if (!token) {
        return next(new Error("Authentication error: No access token found"));
      }

      // Verify the JWT access token
      const decoded = tokenService.verifyAccessToken(token);
      console.log(decoded);
      // Make sure the user still exists and isn't locked
      const user = await User.findById(decoded.id);
      if (!user || user.isLocked) {
        return next(new Error("Authentication error: User not found or locked"));
      }

      // Attach verified user info to the socket for later use
      socket.userId = user._id.toString();
      socket.userRole = user.role;

      console.log(`Authenticated user connected: ${socket.userId}`);
      next();
    } catch (err) {
      console.error("WebSocket auth failed:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  // Handle real-time events after successful connection
  io.on("connection", (socket) => {
    // Join the user's private room using their verified ID
    socket.on("join-user-room", () => {
      const room = `user_${socket.userId}`;
      socket.join(room);
      console.log(`User ${socket.userId} joined their room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.userId || socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;