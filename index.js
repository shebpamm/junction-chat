const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const APP_PORT = process.env.PORT || 8080;

app.use('/', express.static(__dirname + '/front'));

function publishMessage(message) {
    
}

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
        });

    socket.on('chat message', (msg) => {
        data = publishMessage(msg);
        io.emit('chat message', msg);
        console.log(msg.username + ': ' + msg.message);
    });
});

server.listen(8080, () => {
    console.log(`Server listening on port ${APP_PORT}`);
});