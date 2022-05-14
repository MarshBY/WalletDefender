import express from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { start, addTransaction } from './main.js';
import 'dotenv/config'

const app = express();

const saltRounds = 10;
let hashedToken = '';

const createAPIKey = async () => {
    const token = crypto.randomUUID();
    hashedToken = await bcrypt.hash(token, saltRounds);
    console.log('Your API key: ', token);
}

app.use(express.json())

app.use((req, res, next) => {
    if(hashedToken == '') { return res.status(500).send(); }
    if(!req.body || !req.body.token) { res.status(400).send('No token'); }
    bcrypt.compare(req.body.token, hashedToken, (err, result) => {
        if(result) {
            next()
        }else{
            res.status(401).send();
        }
    });
})

app.post('/', (req, res) => {
    if(!req.body.txHash) { return res.status(400).send(); }
    addTransaction(req.body.txHash);
    return res.status(200).send("'" + req.body.txHash + "' added.");
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    createAPIKey();
    console.log('Listening on port ', PORT);
    start();
})
