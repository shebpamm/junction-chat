const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected');
});

const APP_PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
        });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

server.listen(8080, () => {
    console.log(`Server listening on port ${APP_PORT}`);
});