var e = module.exports = {};
var bu = require('./../util.js');
var http = require('http');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'xkcd [number]';
e.info = 'Gets an xkcd comic. If a number is not specified, gets a random one.';
e.category = bu.CommandType.GENERAL;

var xkcdMax = 0;

e.execute = (msg, words, text) => {
    getXkcd(msg.channel.id, words);
};

function getXkcd(channel, words) {
    if (xkcdMax === 0) {
        http.get("http://xkcd.com/info.0.json", function (res) {
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                console.log(body);
                var output = JSON.parse(body);
                xkcdMax = output.num;
                getXkcd(channel, words);

                //sendMessageToDiscord(channel, output.file, bot);
            });
        });
        return;
    }
    var choice;
    if (words.length === 1) {
        choice = bu.getRandomInt(1, xkcdMax);
    } else {
        choice = parseInt(words[1]);
        if (choice > xkcdMax || choice < 0) {
            bu.sendMessageToDiscord(channel, `Comic #${choice} does not exist!`);
        }
    }
    var url = '';
    if (choice === 0) {
        url = "http://xkcd.com/info.0.json";
    } else {
        url = `http://xkcd.com/${choice}/info.0.json`;
    }
    http.get(url, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            console.log(body);
            var output = JSON.parse(body);
            var message = '';
            //  if (bot === BotEnum.DISCORD) {
            message = `${output.img}
\`\`\`diff
!=-= [ ${output.title}, ${output.year} ] =-=!
Comic #${output.num}
+ ${output.alt}
\`\`\``;
            bu.sendMessageToDiscord(channel, message);
            xkcdMax = output.num;
            //getXkcd(channel, words, bot);
            //sendMessageToDiscord(channel, output.file, bot);
        });
    });
}