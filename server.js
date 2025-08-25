const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // biar bisa diakses dari vercel
  }
});

let rooms = {}; // simpan state tiap room

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        board: Array(9).fill(""),
        currentPlayer: "X",
      };
    }

    if (rooms[room].players.length < 2) {
      rooms[room].players.push(socket.id);
      socket.emit("joined", { player: rooms[room].players.length === 1 ? "X" : "O" });
    }

    io.to(room).emit("updateGame", rooms[room]);
  });

  socket.on("makeMove", ({ room, index }) => {
    let game = rooms[room];
    if (!game) return;

    if (game.board[index] === "") {
      game.board[index] = game.currentPlayer;
      game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
    }

    io.to(room).emit("updateGame", game);
  });

  socket.on("resetGame", (room) => {
    if (rooms[room]) {
      rooms[room].board = Array(9).fill("");
      rooms[room].currentPlayer = "X";
      io.to(room).emit("updateGame", rooms[room]);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    for (let room in rooms) {
      rooms[room].players = rooms[room].players.filter(p => p !== socket.id);
      if (rooms[room].players.length === 0) {
        delete rooms[room];
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
