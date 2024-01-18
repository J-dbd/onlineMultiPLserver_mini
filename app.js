const express = require("express");

const app = express();
const port = 3000;

/** socket io set up
 * import HTTP package and creat a server based on HTTP
 * wrap the server around our express app
 * so http package comes with node.js by default
 */
const http = require("http");
const server = http.createServer(app);
/** get server lib */
/**
 * [ server of socket.io ]
 * socket.io only can handle http server, not the express server.
 *
 * socket.io's server integrates with (or mounts on) the Node.JS HTTP Server (the socket.io package)
 * (wrapping http server > express ... for abstraction)
 */
const { Server } = require("socket.io");
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 });

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

/** Holding all Plyaers in BE */
const players = {};
/** whenever a new player connects to game, we need to broadcast a state of every player */
/** connection btw BE and FE  */
io.on("connection", (socket) => {
  console.log(`a user connected: ${socket.conn.transport.name} / ${socket.id}`);
  players[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    color: `hsl(${360 * Math.random()}, 100%, 50%)`,
  };
  /** broadcast to players just connected  */
  //socket.emit('updatePlyaers', players)

  /** broadcast to everyone: new pl has joined,so render the result. */
  io.emit("updatePlayers", players);

  socket.on("disconnect", (reason) => {
    console.log(`a user disconnected: reason:${reason}`);
    delete players[socket.id]; // del in BE
    io.emit("updatePlayers", players); // Broadcast to everyone's FE
  });
});

/**for soket.io, change app.listener to server.listener */
server.listen(port, () => {
  console.log(`[INFO] Mini Server listening at http://localhost:${port}`);
});
