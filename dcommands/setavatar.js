var e = module.exports = {}
var bu = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = '';
e.info = '';
e.category = bu.CommandType.CAT

e.execute = (msg, words, text) => {
    if (msg.user.id === bu.CAT_ID) {
        var request = require('request').defaults({encoding: null});
        var avatarUrl = '';
        if (msg.attachments.length > 0) {
            avatarUrl = msg.attachments[0].url;
        } else if (words.length > 1) {
            avatarUrl = words[1];
        } else {
            bu.sendMessageToDiscord(msg.channel.id, "No URL given.");
        }
        request.get(avatarUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
                console.log(data);
                var p1 = bot.editSelf({avatar: data});
                p1.then(function () {
                    bu.sendMessageToDiscord(msg.channel.id, ":ok_hand: Avatar set!");
                })
            }
        });
    }
}