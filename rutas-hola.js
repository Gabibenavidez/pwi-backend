const express = require('express');
const app = express.Router();

// hola
app.get('/', (req, res) => {
    res.send('hola');
});

app.get('/dos', (req, res) => {
    res.send('hola /dos');
});

module.exports = app;