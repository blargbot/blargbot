/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:31:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-08 00:52:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const express = require('express');
const bodyParser = require('body-parser');

var app;
var e = module.exports;

var server;

e.init = () => {
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    server = app.listen(8081, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.init('Interface listening at http://%s:%s', host, port);
    });

    app.get('/user/:id', (req, res) => {
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
            r.table('user').get(req.params.id).run().then(user => {
                if (user) {
                    objectToSend = {
                        id: req.param.id,
                        username: user.username,
                        discriminator: user.discriminator || '????',
                        avatarURL: 'not found',
                        bot: user.isbot
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
};

e.kill = () => {
    server.close();
};

function checkAuth(object, req, res) {
    if (config.general.interface_key != req.get('key'))
        object = {
            error: 401,
            desc: 'who the fuck are you get off my lawn'
        };
    return JSON.stringify(object, null, 4);
}

var notFound = {
    error: 404,
    desc: 'you fucked up kthx'
};