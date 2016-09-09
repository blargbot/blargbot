var e = module.exports = {};
var bu = require('./../util.js');
var http = require('http');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};

e.isCommand = true;
e.requireCtx = require;
e.hidden = false;
e.usage = 'cat <tags>';
e.info = 'Gets a picture of a cat.';
e.category = bu.CommandType.GENERAL;


e.execute = (msg) => {
    var output;
    http.get('http://random.cat/meow', function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            console.log(body);
            output = JSON.parse(body);
            bu.sendMessageToDiscord(msg.channel.id, output.file);
        });
    });
};