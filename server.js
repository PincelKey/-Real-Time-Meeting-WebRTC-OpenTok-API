require('dotenv').config()

const express   = require('express');
const app       = express();
const OpenTok   = require('opentok');
const cors      = require('cors');
const fs        = require('fs');
const http      = require('http');
const https     = require('https');
const readline  = require('readline');

const options = {
    key: fs.readFileSync('../app/ssl/server.key'),
    cert: fs.readFileSync('../app/ssl/server.crt'),
}
const opentok = new OpenTok(process.env.OPENTOK_API_KEY, process.env.OPENTOK_API_SECRET);

const server = https.createServer(options, app).listen(process.env.PROJECT_PORT, function() {
    console.log("Express server listening on port " + process.env.PROJECT_PORT);
});

app.use(cors({
    origin: 'https://192.168.0.118:3000'
}));

app.post('/session', function (req, res) {
    opentok.createSession(async function(err, session) {
        res.setHeader('Content-Type', 'application/json');

        if (err) {
            res.end(JSON.stringify({
                status: false
            }));
        } else {
            fs.truncate('database/data.txt', 0, function(){ console.log('Cleaned data') })

            const fileStream = fs.createWriteStream('database/data.txt', { flags : 'a' });

            fileStream.write(session.sessionId);

            res.end(JSON.stringify({
                session: session.sessionId,
                token: opentok.generateToken(session.sessionId)
            }));
        }
    });
})

app.get('/session/:id', async function (req, res) {
    const fileStream = fs.createReadStream('database/data.txt');
    let data = [];

    const rows = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const register of rows) {
        data.push(register);
    }

    res.end(JSON.stringify({
        sessionId: data[0],
        token: opentok.generateToken(data[0]),
        apiKey: process.env.OPENTOK_API_KEY,
    }));
})