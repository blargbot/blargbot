var e = module.exports = {};



e.init = () => {
    
    
    e.category = bu.CommandType.CAT;
};

e.requireCtx = require;

e.isCommand = true;
e.hidden = false;
e.usage = '';
e.info = '';

e.execute = (msg, words) => {
    if (msg.author.id == bu.CAT_ID) {
        let channel = '';
        let messages = [];
        if (bot.channelGuildMap.hasOwnProperty(words[1])) {
            channel = words[1];
            messages = words.slice(2);
        } else {
            channel = msg.channel.id;
            messages = words.slice(1);
        }
        if (msg.channel.guild.members.get(bot.user.id).permission.json.manageMessages) {
            bot.deleteMessages(channel, messages);
        } else {
            messages.forEach(m => {
                bot.deleteMessage(channel, m);
            });
        }
    }
};
