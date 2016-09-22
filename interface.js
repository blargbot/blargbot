var express = require('express');
var bu = require('./util.js');

var app;
var e = module.exports;
var bot;

e.init = (b) => {
    bot = b;
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
                avatarURL: user.avatarURL
            };
        } else {
            objectToSend = notFound;
        }
        res.end(checkAuth(objectToSend, req, res));
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