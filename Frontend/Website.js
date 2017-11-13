const Database = require('../Core/Database');

const Sender = require('../Core/Structures/Sender');
const path = require('path');
const express = require('express');
const sassMiddleware = require('node-sass-middleware');
const passport = require('passport');
const Strategy = require('passport-discord').Strategy;
const session = require('express-session');
const config = require('../config');
global._config = config;

const { Nuxt, Builder } = require('nuxt');
const nuxtConfig = require('./nuxt.config.js');
const nuxt = new Nuxt(nuxtConfig);
if (nuxt.options.dev) {
    new Builder(nuxt).build();
}
const Logger = require('../Core/Logger');
new Logger(process.env.SHARD_ID, config.log.level || 'info').setGlobal();
process.on('unhandledRejection', (err, p) => {
    console.error('Unhandled Promise Rejection:', err.stack);
});

class Website extends Sender {
    constructor(port = 8078) {
        super();
        this.database = new Database(this);
        this.database.authenticate().then(() => {
        });

        this.sessionUserMap = {};
        this.port = port;
        this.app = express();
        passport.serializeUser((user, done) => {
            done(null, user);
        });
        passport.deserializeUser((obj, done) => {
            done(null, obj);
        });
        passport.use(new Strategy({
            clientID: config.website.id,
            clientSecret: config.website.secret,
            callbackURL: config.website.callback,
            scope: this.scopes
        }, (accessToken, refreshToken, profile, done) => {
            process.nextTick(function () {
                return done(null, profile);
            });
        }));

        this.app.use(session({
            secret: config.website.sessionSecret,
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: false,
                maxAge: 86400000,
                httpOnly: false
            }
        }));
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.app.get('/login', (req, res, next) => {
            req.session.returnTo = req.query.path || '/';
            next();
        }, passport.authorize('discord', {
            scope: this.scopes
        }));
        this.app.get('/callback', passport.authenticate('discord', {
            failureRedirect: '/'
        }), (req, res) => {
            req.session.user = req.user;
            this.sessionUserMap[req.sessionID] = req.user;
            res.redirect(req.session.returnTo || '/');
        });
        this.app.get('/logout', (req, res) => {
            req.logout();
            delete this.sessionUserMap[req.sessionID];
            delete req.session.user;
            res.redirect(req.session.returnTo || '/');
        });

        this.app.set('views', path.join(__dirname, 'views'));


        this.app.use(sassMiddleware({
            src: path.join(__dirname, 'scss'),
            dest: path.join(__dirname, 'public', 'css'),
            prefix: '/css/'
        }));

        this.app.use('/', express.static(path.join(__dirname, 'public')));
        this.app.use('/locale', express.static(path.join(__dirname, '..', 'Locale')));
        this.app.use('/dist', express.static(path.join(__dirname, 'Vue', 'dist')));
        this.app.use('/api', new (require('./routes/api'))(this).router);
        //this.app.use('/', require('./routes/main'));
        this.app.use(nuxt.render);
    }

    getData() {
        return { getOrCreateObject() { } };
    }

    get nuxt() { return nuxt; }

    get scopes() {
        return ['identify', 'guilds'];
    }

    checkAuth(req, res, next) {
        if (res.isAuthenticated()) return next();
        res.send('not logged in :(');
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('Website listening on port', this.port);
            this.send('threadReady', process.env.SHARD_ID);
        });
    }

    get options() {
        return {
            rootPath: path.join(__dirname, 'views'),
            data: {
                fact: 'Super cool cat fact!'
            },
            vue: {
                head: {
                    meta: [
                        { script: 'https://unpkg.com/vue/dist/vue.js' },
                        { style: '/css/materialize.css' },
                        { style: '/css/style.css' },
                        {
                            name: 'viewport',
                            content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                        },
                        { script: 'https://code.jquery.com/jquery-3.2.1.min.js' },
                        { script: '/js/materialize.min.js' },
                        { script: 'https://unpkg.com/axios/dist/axios.min.js' }
                    ]
                }
            }
        };
    }
}

module.exports = Website;

const website = new Website();
website.start();

process.on('message', async msg => {
    const { data, code } = JSON.parse(msg);
    if (code.startsWith('await:')) {
        website.emit(code, data);
        return;
    }
    switch (code) {
        case 'await':
            const eventKey = 'await:' + data.key;
            switch (data.message) {

            }
            break;
        default:
            break;
    }
});