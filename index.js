const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const axios = require('axios');


const APP_PORT = process.env.PORT || 8080;

app.use('/', express.static(__dirname + '/front'));

function publishMessage(message) {
    return axios.post(
        'https://us-central1-junction-2021-fee21.cloudfunctions.net/webApi/api/v1/message',
         message);
}

function getMessages() {
    return axios.get(
        'https://us-central1-junction-2021-fee21.cloudfunctions.net/webApi/api/v1/messages');
}

io.on('connection', async (socket) => {
    console.log('a user connected');

    const messages = await getMessages();
    for (const message of messages.data) {
        socket.emit('chat message', message);
    }

    socket.on('disconnect', () => {
        console.log('user disconnected');
        });

    socket.on('chat message', async (msg) => {
        data = await publishMessage(msg);
        io.emit('chat message', data.data);
        console.log(msg.username + ': ' + msg.message);
    });
});

server.listen(8080, () => {
    console.log(`Server listening on port ${APP_PORT}`);
});