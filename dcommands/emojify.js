var e = module.exports = {};

var request = require('request');

e.init = () => {
    e.category = bu.CommandType.GENERAL;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'emojify <text>';
e.alias = ['💬'];
e.info = 'Gets emojis based on input.';
e.longinfo = '<p>Gets emojis based on input.</p>';


e.execute = (msg, words) => {
    var options = {
        uri: 'https://emoji.getdango.com/api/emoji?q=' + encodeURIComponent(words.splice(1, words.length).join(' ')),
        headers: {
            'User-Agent': 'blargbot/1.0 (ratismal)'
        }
    };
    request(options, (err, res, body) => {
        if (!err && res.statusCode == 200) {
            var emojis = JSON.parse(body);
            var toSend = '';
            for (var i = 0; i < emojis.results.length && i < 8; i++) {
                toSend += emojis.results[i].text;
            }
            bu.send(msg, toSend);
        }
    });
};