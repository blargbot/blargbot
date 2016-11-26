var e = module.exports = {};

const path = require('path');
const http = require('http');
const express = require('express');
const fs = require('fs');
const router = express.Router();
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const Strategy = require('passport-discord').Strategy;
const hbs = require('hbs');
const helpers = require('./helpers');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

helpers.init();


const server = app.server = http.createServer(app);

var scopes = ['identify'];


function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.send('not logged in :(');
}

e.init = () => {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });
    passport.use(new Strategy({
        clientID: config.website.clientid,
        clientSecret: config.website.secret,
        callbackURL: config.website.callback,
        scope: scopes
    }, function(accessToken, refreshToken, profile, done) {
        process.nextTick(function() {
            return done(null, profile);
        });
    }));
    app.use(session({
        secret: config.website.sessionsecret,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 86400000,
            httpOnly: false
        }
    }));

    app.use(passport.initialize());
    app.use(passport.session());
    app.get('/login', passport.authenticate('discord', {
        scope: scopes
    }), function(req, res) {});
    app.get('/callback',
        passport.authenticate('discord', {
            failureRedirect: '/'
        }),
        function(req, res) {
            logger.website('A user has authenticated');
            res.redirect(req.session.returnTo || '/');
        } // auth success
    );
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect(req.session.returnTo || '/');
    });
    app.get('/info', checkAuth, function(req, res) {
        logger.debug(req.user);
        //res.json(req.user);
        res.end(`<p>The person below sucks</p>
        <img src="https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.jpg">
        <p>${req.user.username}#${req.user.discriminator}</p>
        `);
    });

    app.use('/', require('./routes/index'));
    app.use('/commands', require('./routes/commands'));
    app.use('/tags', require('./routes/tags'));
    app.use('/logs', require('./routes/logs'));
    app.use('/dashboard', require('./routes/dashboard'));
    app.use('/donate', require('./routes/donate'));


    app.use(router);
    logger.website('Website listening on :8085');
    server.listen(8085);
    return app;
};