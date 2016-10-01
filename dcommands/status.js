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
e.usage = 'status <code> [cat | dog]';
e.info = 'Gets you an image of an HTTP status code.';
e.info = '<p>Gets you an image of an HTTP status code.</p>';


e.execute = (msg, words, text) => {
    if (!words[1]) {
        bu.send(msg.channel.id, `400 BAD REQUEST\nNot enough arguments provided!`);
        return;
    }
    let code = parseInt(words[1]);
    if (isNaN(code)) {
        bu.send(msg.channel.id, `400 BAD REQUEST\nInvalid code provided!`);
        return;
    }
    let urlStart;
    if (words[2]) {
        if (words[2].toLowerCase() == 'cat') {
            urlStart = `https://http.cat/`;
        } else if (words[2].toLowerCase() == 'dog') {
            urlStart = `https://httpstatusdogs.com/img/`;
        }
    } else {
        urlStart = bu.getRandomInt(0, 1) == 0 ? `https://http.cat/` : `https://httpstatusdogs.com/img/`;
    }
    var url = urlStart + encodeURIComponent(code + '.jpg');

    var i = url.lastIndexOf('/');
    if (i != -1) {
        var filename = url.substring(i + 1, url.length);
        request({
            uri: url,
            encoding: null
        }, function (err, res, body) {
            console.log(res.headers['content-type']);
            if (res.headers['content-type'] == 'text/html') {
                bu.sendFile(msg.channel.id, '', urlStart + encodeURIComponent(404 + '.jpg'));
            } else
                bu.send(msg.channel.id, '', {
                    name: filename,
                    file: body
                });
        });
    }

};