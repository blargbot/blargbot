var e = module.exports = {};

const path = require('path');
const http = require('http');
const express = require('express');
const fs = require('fs');
const router = express.Router();
const app = express();

app.set('view engine', 'hbs');
//app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const server = app.server = http.createServer(app);

/*
app.use(require('express-session')({
    secret: require('../config.json').backend.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 86400000,
        httpOnly: false
    }
}));*/

app.use('/', require('./routes/index'));
app.use(router);

e.init = () => {
    logger.website('Website listening on :8085');
    server.listen(8085);
    return app;
};
