const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const axios = require('axios');


const APP_PORT = process.env.PORT || 8080;

app.use('/', express.static(__dirname + '/front'));

async function getTransformedMessage(message) {
    const body = {
        "prompt": `This turns negative messages into emphatic positive ones.\n\nNegative message: ${ message.message }\nPositive message:`,
        "temperature": 0,
        "max_tokens": 60,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "stop": ["\n"]
      }
      const transformedMessage = await axios.post('https://api.openai.com/v1/engines/curie/completions', body, {
        headers: {
            'Authorization': `Bearer ${ config.openai_key }`
        }
      });
      console.log(body);
      message.message = transformedMessage.data.choices[0].text;
      console.log(transformedMessage.data);
      return message;
}

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
        const transformedMessage = await getTransformedMessage(msg);
        console.log(transformedMessage);
        data = await publishMessage(transformedMessage);
        const sendableMessage = {
            id: data.data.id,
            data: data.data
        }
        //console.log(sendableMessage)
        io.emit('chat message', sendableMessage);
    });
});

server.listen(8080, () => {
    console.log(`Server listening on port ${APP_PORT}`);
});