var e = module.exports = {};
var bu;
var request = require('request');
var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;


    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'emojify <text>';
e.alias = ['💬'];
e.info = 'Gets emojis based on input.';

e.execute = (msg, words) => {
    var options = {
        uri: 'https://emoji.getdango.com/api/emoji?q=' + encodeURIComponent(words.splice(1, words.length).join(' ')),
        headers: {
            'User-Agent': 'blargbot/1.0 (ratismal)'
        }
    };
    console.log(options.uri);
    request(options, (err, res, body) => {
        if (!err && res.statusCode == 200) {
            var emojis = JSON.parse(body);
            var toSend = '';
            for (var i = 0; i < emojis.results.length && i < 8; i++) {
                toSend += emojis.results[i].text;
            }
            bu.send(msg.channel.id, toSend);
        }
    });
};