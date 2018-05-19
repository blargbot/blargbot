/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:20:47
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-19 15:48:37
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

var e = module.exports = {};

const router = dep.express.Router();
const app = dep.express();

const Strategy = dep.Strategy;

const helpers = require('./helpers');
app.use(dep.bodyParser.json());
app.use(dep.bodyParser.urlencoded({ // to support URL-encoded bodies
    limit: '50mb',
    extended: true
}));

app.set('view engine', 'hbs');
app.set('views', dep.path.join(__dirname, 'views'));
app.use(dep.express.static(dep.path.join(__dirname, 'public')));

helpers.init();

const server = app.server = dep.http.createServer(app);
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

    dep.passport.serializeUser(function (user, done) {
        done(null, user);
    });
    dep.passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });
    dep.passport.use(new Strategy({
        clientID: config.website.clientid,
        clientSecret: config.website.secret,
        callbackURL: config.website.callback,
        scope: scopes
    }, function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            return done(null, profile);
        });
    }));
    app.use(dep.session({
        secret: config.website.sessionsecret,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 86400000,
            httpOnly: false
        }
    }));

    app.use(dep.passport.initialize());
    app.use(dep.passport.session());
    app.get('/login', dep.passport.authenticate('discord', {
        scope: scopes
    }), function (req, res) { });
    app.get('/callback',
        dep.passport.authenticate('discord', {
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

    app.use(router);
    console.website('Website listening on :8085');
    server.listen(8085, () => {
        server.keepAliveTimeout = 0;
    });
    return app;
};