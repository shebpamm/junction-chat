const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const axios = require('axios');
const config = require('./config.json');


const APP_PORT = process.env.PORT || 8080;

app.use('/', express.static(__dirname + '/front'));

async function isMessageInappropriate(message) {
    const body = {
        "prompt": "<|endoftext|>"+message.message+"\n--\nLabel:",
        "temperature": 0,
        "max_tokens": 1,
        "top_p": 1,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "logprobs": 10
    }

    const openaiResponse = await axios.post('https://api.openai.com/v1/engines/content-filter-alpha/completions', body, {
        headers: {
            'Authorization': 'Bearer ' + config.openai_key
        }
    });

    console.log(openaiResponse.data.choices[0].logprobs.top_logprobs);

    if (openaiResponse.data.choices[0].text === '0' || openaiResponse.data.choices[0].text === '1') {
        return false;
    } else {
        if (openaiResponse.data.choices[0].text === '2') {
            const logprobs = openaiResponse.data.choices[0].logprobs.top_logprobs[0]
            if (logprobs["2"] > -0.355) {
                return true;
            }
        }
    }
}

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
      message.message = transformedMessage.data.choices[0].text;
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
    const sortedMessages = messages.data.sort((a, b) => {
        return new Date(a.data.createdAt) - new Date(b.data.createdAt);
    });

    for (let i = 0; i < sortedMessages.length; i++) {
        const message = sortedMessages[i];
        socket.emit('chat message', message);
    }

    socket.on('disconnect', () => {
        console.log('user disconnected');
        });

    socket.on('chat message', async (msg) => {

        if (await isMessageInappropriate(msg)) {
            io.emit('inappropriate message');
        }

        const transformedMessage = await getTransformedMessage(msg);
        data = await publishMessage(transformedMessage);
        const sendableMessage = {
            id: data.data.id,
            data: data.data
        }
        io.emit('chat message', sendableMessage);
    });
});

server.listen(8080, () => {
    console.log(`Server listening on port ${APP_PORT}`);
});