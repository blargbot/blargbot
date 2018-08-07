/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:20:47
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-08-07 09:44:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

const express = require('express');
const router = express.Router();
const app = express();
const { Strategy } = require('passport-discord');
const helpers = require('./helpers');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    limit: '50mb',
    extended: true
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

helpers.init();

const server = app.server = http.createServer(app);
require('./websocket.js').init(server);

var scopes = ['identify', 'guilds'];

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.send('not logged in :(');
}

const sessionUserMap = {};

e.init = () => {
    bu.getUserFromSession = function (sessionId) {
        return sessionUserMap[sessionId];
    };

    passport.serializeUser(function (user, done) {
        done(null, user);
    });
    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });
    passport.use(new Strategy({
        clientID: config.website.clientid,
        clientSecret: config.website.secret,
        callbackURL: config.website.callback,
        scope: scopes
    }, function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
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
    }), function (req, res) { });
    app.get('/callback',
        passport.authenticate('discord', {
            failureRedirect: '/'
        }),
        function (req, res) {
            console.website('A user has authenticated');
            sessionUserMap[req.sessionID] = req.user.id;
            res.redirect(req.session.returnTo || '/');
        } // auth success
    );
    app.get('/logout', function (req, res) {
        req.logout();
        delete sessionUserMap[req.sessionID];
        res.redirect(req.session.returnTo || '/');
    });
    app.get('/info', checkAuth, function (req, res) {
        console.debug(req.user);
        //res.json(req.user);
        res.end(`<p>The person below sucks</p>
        <img src="https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.jpg">
        <p>${req.user.username}#${req.user.discriminator}</p>
        `);
    });

    app.get('/messages', function (req, res) {
        res.locals.url = config.general.isbeta ? 'ws://localhost:8085' : 'wss://blargbot.xyz';
        res.render('messages');
    });

    app.get('/metrics', function (req, res) {
        let register = bu.Metrics.aggregated;
        res.set('Content-Type', register.contentType)
        res.end(register.metrics())
    });

    let avatarInvalidation = {};
    app.get('/avatar/:id', async function (req, res) {
        let id = req.params.id.split('.')[0];
        try {
            let u = bot.users.get(id);
            if (!u) {
                console.website('Avatar Endpoint: Retrieving user', id)
                u = await bot.getRESTUser(id);
                bot.users.add(u);
                if (avatarInvalidation[id])
                    clearTimeout(avatarInvalidation[id]);
                avatarInvalidation[id] = setTimeout(() => {
                    bot.users.remove({ id });
                }, 1000 * 60 * 15); // invalidate after 15 minutes
            }
            res.redirect(u.dynamicAvatarURL(undefined, 1024));
        } catch (err) {
            console.error(err);
            res.send('heck off');
        }
    });
    app.get('/feedback/:id', async function (req, res) {
        let url = 'https://airtable.com/shrEUdEv4NM04Wi7O/tblyFuWE6fEAbaOfo/viwDg5WovcwMA9NIL/' + req.params.id;
        res.redirect(url);
    })

    app.use('/', require('./routes/index'));
    app.use('/commands', require('./routes/commands'));
    app.use('/tags', require('./routes/tags'));
    app.use('/logs', require('./routes/logs'));
    app.use('/dashboard', require('./routes/dashboard'));
    app.use('/donate', require('./routes/donate'));
    app.use('/user', require('./routes/user'));
    app.use('/colour', require('./routes/colour'));
    app.use('/color', require('./routes/colour'));
    app.use('/output', require('./routes/output'));

    app.use(router);
    console.website('Website listening on :8085');
    server.listen(8085, () => {
        server.keepAliveTimeout = 0;
    });
    return app;
};