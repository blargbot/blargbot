var express = require('express');
var bu;

var app;
var e = module.exports;
var bot;

e.init = (b, blargutil) => {
    bot = b;
    bu = blargutil;
    app = express();
    app.get('/user/:id', (req, res) => {
        //console.log()
        //   console.dir(req.params)
        var user = bot.users.get(req.params.id);
        var objectToSend;
        if (user) {
            objectToSend = {
                id: user.id,
                username: user.username,
                discriminator: user.discriminator,
                avatarURL: user.avatarURL,
                bot: user.bot
            };
            res.end(checkAuth(objectToSend, req, res));

        } else {
            bu.db.query(`select username, isbot, discriminator from user where userid = ?`, [req.params.id], (err, rows) => {
                if (rows && rows[0]) {
                    objectToSend = {
                        id: req.param.id,
                        username: rows[0].username,
                        discriminator: rows[0].discriminator || '????',
                        avatarURL: 'not found',
                        bot: rows[0].isbot
                    };
                } else {
                    objectToSend = notFound;
                }
                res.end(checkAuth(objectToSend, req, res));

            });
        }
    });

    app.get('/channel/:id', (req, res) => {
        var channel = bot.getChannel(req.params.id);
        var objectToSend = {};
        if (channel) {
            objectToSend = {
                id: channel.id,
                name: channel.name,
                guildid: channel.guild.id,
                guildname: channel.guild.name
            };
        } else {
            objectToSend = notFound;
        }
        res.end(checkAuth(objectToSend, req));
    });

    app.get('/guild/:id', (req, res) => {
        var guild = bot.guilds.get(req.params.id);
        var objectToSend;
        if (guild) {
            objectToSend = {
                id: guild.id,
                name: guild.name
            };
        } else {
            objectToSend = notFound;
        }
        res.end(checkAuth(objectToSend, req));
    });

    var server = app.listen(8081, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Interface listening at http://%s:%s', host, port);
    });
};

function checkAuth(object, req, res) {
    //  console.dir(req.get('key'), bu.config.general.interface_key);
    if (bu.config.general.interface_key != req.get('key'))
        object = {
            error: 403,
            desc: 'who the fuck are you get off my lawn'
        };
    return JSON.stringify(object, null, 4);
}

var notFound = {
    error: 404,
    desc: 'you fucked up kthx'
};