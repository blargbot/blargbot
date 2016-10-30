var e = module.exports = {};



e.init = () => {
    
    

    e.category = bu.CommandType.ADMIN;

};
e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = 'tidy [amount]';
e.info = 'Clears messages from chat. Defaults to 25.';
e.longinfo = `<p>Cleans a number of messages, defaulting to 25.</p>`;

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
        var p2 = bu.send(msg, `Deleted ${num} messages.`);
        p2.then(function (val) {
            setTimeout(function () {
                //   bot.deleteMessage(msg.channel.id, msg.id).catch(err => logger.(err));
                bot.deleteMessage(msg.channel.id, val.id).catch(err => logger.error(err));
            }, 5000);
        });
        return num;
    }).catch((err) => {
        if (err) {
            bu.send(msg, 'I need to be able to Manage Messages to do that!');
            logger.error(err);
        }
    });
};