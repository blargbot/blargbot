const express = require('express');
const request = require('request');
const moment = require('moment');
const bodyParser = require('body-parser');

var bu;

var app;
var e = module.exports;
var bot;
var server;

e.init = (b, blargutil) => {
    bot = b;
    bu = blargutil;
    app = express();
    app.use(bodyParser.json());
    
    server = app.listen(8081, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Interface listening at http://%s:%s', host, port);
    });

    app.post('/gitlog/push', (req, res) => {
        var responseObj = {
            err: 401,
            desc: 'no u'
        };
        console.log(req.get('X-Hub-Signature'), bu.config.general.gitlogHash);
        if (req.get('X-Hub-Signature') == bu.config.general.gitlogHash) {
            console.dir(req);
            let body = JSON.parse(req.body);
            responseObj = {
                err: 418,
                desc: 'whew such a professional interface'
            };
            let toSend = {
                username: 'Gumdrop',
                text: '**__New Commit__**',
                attachments: [
                    {
                        author_icon: body.sender.avatar_url,
                        author_name: body.sender.login,
                        text: `From \`${body.before}\` to \`${body.after}\``,
                        color: '#36a64f',
                        mrkdwn_in: ['text', 'fields'],
                        fields: []
                    }
                ],
                mrkdwn: true
            };
            for (let i = 0; i < body.commits.length; i++) {
                let commit = {
                    title: '',
                    value: '',
                    short: true
                };
                commit.title = body.commits[i].message;
                commit.value = moment(body.commits[i].timestamp).format('LLLL');
                toSend.attachments[0].fields.push(commit);
            }
            console.log(`Sending a POST request to webhook`);
            request({
                url: bu.config.general.gitlogWebhook,
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(toSend)
            });
        }
        console.log(`Ending POST request to /gitlog/push with ${JSON.stringify(responseObj, null, 4)}`);
        res.end(JSON.stringify(responseObj, null, 4));
    });

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
};

e.kill = () => {
    server.close();
};

function checkAuth(object, req, res) {
    //  console.dir(req.get('key'), bu.config.general.interface_key);
    if (bu.config.general.interface_key != req.get('key'))
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