var e = module.exports = {};
var bu = require('./../util.js');

var bot;
e.init = (Tbot) => {
    bot = Tbot;
};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'tidy [amount]';
e.info = 'Clears messages from chat. Defaults to 25.';
e.longinfo = `<p>Cleans a number of messages, defaulting to 25.</p>`;
e.category = bu.CommandType.ADMIN;

e.execute = (msg, words) => {
  //  if (!bu.hasPerm(msg, 'Bot Commander')) {
 //       return;
  //  }
    var limit = 25;
    if (words.length > 1) {
        limit = parseInt(words[1]);
    }
    bot.purgeChannel(msg.channel.id, limit).then((num) => {
  //      (err)
        var p2 = bu.sendMessageToDiscord(msg.channel.id, `Deleted ${num} messages.`);
        p2.then(function (val) {
            setTimeout(function () {
             //   bot.deleteMessage(msg.channel.id, msg.id).catch(err => console.log(err));
                bot.deleteMessage(msg.channel.id, val.id).catch(err => console.log(err));
            }, 5000);
        });
        return num;
    }).catch((err) => {
        if (err) {
            bu.sendMessageToDiscord(msg.channel.id, 'I need to be able to Manage Messages to do that!');
            console.log(err);
        } 
    });
};