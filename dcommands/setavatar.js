var e = module.exports = {};
var bu;

var bot;
e.init = (Tbot, blargutil) => {
    bot = Tbot;
    bu = blargutil;

    e.category = bu.CommandType.CAT;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg, words) => {
    if (msg.author.id === bu.CAT_ID) {
        var request = require('request').defaults({ encoding: null });
        var avatarUrl = '';
        if (msg.attachments.length > 0) {
            avatarUrl = msg.attachments[0].url;
        } else if (words.length > 1) {
            avatarUrl = words[1];
        } else {
            bu.sendMessageToDiscord(msg.channel.id, 'No URL given.');
        }
        request.get(avatarUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let data = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
                bu.logger.debug(data);
                var p1 = bot.editSelf({ avatar: data });
                p1.then(function () {
                    bu.sendMessageToDiscord(msg.channel.id, ':ok_hand: Avatar set!');
                });
            }
        });
    }
};