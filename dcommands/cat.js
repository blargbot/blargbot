var e = module.exports = {};
var bu;
var http = require('http');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;


    e.category = bu.CommandType.GENERAL;
};

e.isCommand = true;

e.requireCtx = require;
e.hidden = false;
e.usage = 'cat <tags>';
e.info = 'Gets a picture of a cat.';
e.info = '<p>Displays a picture of a cat, taken from <a href="http://random.cat/">random.cat</a></p>';


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