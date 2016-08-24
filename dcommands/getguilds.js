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
        var message = 'Guilds:\n';
        bot.guilds.forEach(function (guild, id) {
            message += ` - ${guild.name} (${id})\n`;
        });
        //var keys = bot.guilds.keys();
        // for (var i = 0; i < keys.length; i++) {
        //      console.log('kek');
        //     message += ` - ${bot.guilds.get(keys[i])} (${keys[i]})\n`
        // }
        blargutil.sendMessageToDiscord(msg.channel.id, message);

    }
}