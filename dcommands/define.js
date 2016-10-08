var e = module.exports = {};
var bu;
var request = require('request');
var moment = require('moment');

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;

e.hidden = false;
e.usage = 'define <word>';
e.info = 'Gets the definition for the specified word. The word must be in english.';
e.longinfo = `<p>Gets the definition for the specified word. The word must be in english.</p>`;

var part = {
    verb: 'v',
    noun: 'n',
    adjective: 'a',
    pronoun: 'p'
};

e.execute = (msg, words) => {
    words.shift();
    var args = words.join(' ');
    var config = bu.config;
    if (!config.general.wordapis)
        config.general.wordapis = {
            day: moment().format('D'),
            uses: 0
        };

    if (config.general.wordapis.day != moment().format('D')) {
        config.general.wordapis.day = moment().format('D');
        config.general.wordapis.uses = 0;
    }
    var max = config.general.isbeta ? 250 : 1500;
    if (config.general.wordapis.uses > max) {
        bu.sendMessageToDiscord(msg.channel.id, 'I have used up all of my api queries for today. Sorry!');
        return;
    }
    config.general.wordapis.uses++;
    bu.saveConfig();
    request({
        url: `https://wordsapiv1.p.mashape.com/words/${args}`,
        headers: {
            'X-Mashape-Key': bu.config.general.mashape,
            'Accept': 'application/json'
        }
    }, function (error, response, body) {

        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            var message = `Definitions for ${args}:\n`;
            if (res.results) {
                message += `\`\`\`xl\n`;

                for (let i = 0; i < res.results.length; i++) {
                    var type = res.results[i].partOfSpeech;
                    message += `${res.results.length >= 10 ? (i + 1 < 10 ? ` ${i + 1}` : i + 1) : i + 1}: (${part[type] ? part[type] : type}) ${res.results[i].definition}\n`;
                }
                message += `\`\`\``;
            } else {
                message += 'No results found!';
            }
            bu.sendMessageToDiscord(msg.channel.id, message);
        } else {
            bu.sendMessageToDiscord(msg.channel.id, 'No results found!');

        }
    });
};