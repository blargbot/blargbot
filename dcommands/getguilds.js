var e = module.exports = {}
var blargutil = require('./../util.js')

var bot
e.init = (Tbot) => {
    bot = Tbot
}
e.requireCtx = require

e.isCommand = true
e.hidden = false
e.usage = '';
e.info = '';
e.category = blargutil.CommandType.CAT

e.execute = (msg, words, text) => {
    if (msg.author.id === blargutil.CAT_ID) {
        var messages = []
        var i = 0;
        messages.push(`Guilds (page ${i}):\n`)
        bot.guilds.forEach(function (guild, id) {
            var addTo = ` - ${guild.name} (${id})\n`;
            if (messages[i].length + addTo.length > 2000) {
                i++;
                messages.push(`Guilds (page ${i}):\n`)
            }
            messages[i] += addTo
        });
        for (var i = 0; i < messages.length; i++) {
            blargutil.sendMessageToDiscord(msg.channel.id, messages[i]);
        }

    }
}