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
        if (bot.channelGuildMap.hasOwnProperty(words[1])) {
            channel = words[1];
            bu.send(channel, words.slice(2).join(' '));
        } else {
            channel = msg.channel.id;
            bu.send(channel, words.slice(1).join(' '));
        }
    }
};