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
e.usage = 'econ <from> <to> <amount>';
e.info = 'Converts currency using recent rates.';
e.category = bu.CommandType.GENERAL;

e.execute = (msg, words, text) => {
    if (words.length < 4) {
        bu.sendMessageToDiscord(msg.channel.id, "Incorrect usage!\n`econ \<from> \<to> \<amount>`");
        return;
    }
    var to = words[2].toUpperCase();
    var from = words[1].toUpperCase();
    var convert = words[3];

    var url = `http://api.fixer.io/latest?symbols=${to}&base=${from}`;

    http.get(url, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            var rates = JSON.parse(body);
            if (rates.error != null && rates.error === "Invalid base") {
                bu.sendMessageToDiscord(msg.channel.id, `Invalid currency ${from}\n\`econ \<from\> \<to\> \<amount\>\``);
                return;
            }
            if (rates.rates[to] == null) {
                bu.sendMessageToDiscord(msg.channel.id, `Invalid currency ${to}\n\`econ \<from\> \<to\> \<amount\>\``);
                return;
            }
            var converted = Math.round((convert * rates.rates[to]) * 100.0) / 100;
            var message = `${convert} ${from} is equivalent to ${converted} ${to}`;
            bu.sendMessageToDiscord(msg.channel.id, message);

        });
    });
};