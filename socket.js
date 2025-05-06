// socket.js
let io; // Denne variable holder io-instansen

module.exports = {
  init: (server) => {
    const socketIo = require("socket.io");
    io = socketIo(server, {
      cors: {
        origin: "http://localhost:5173",
        credentials: true,
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
