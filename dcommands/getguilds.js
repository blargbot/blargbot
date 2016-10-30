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
    if (msg.author.id === bu.CAT_ID) {
        var gArray;
        var botRatio = false;
        if (words[1]) {
            if (words[1].toLowerCase() == 'bots') {
                gArray = bot.guilds.filter(m => m.members.filter(m2 => m2.user.bot).length / m.memberCount > 0.8 || /bot/gi.test(m.name));
                botRatio = true;
            }
        }
        if (!gArray) {
            gArray = bot.guilds.map(m => m);
        }
        var messages = [];
        var i = 0;
        messages.push(`Guilds (page ${i}):\n`);
        gArray.forEach(function (guild) {
            var addTo = ` - ${guild.name} (${guild.id})${botRatio
                ? ` ${Math.round(guild.members.filter(m2 => m2.user.bot).length / guild.memberCount * 100)}% Bots`
                : ''}\n`;
            if (messages[i].length + addTo.length > 2000) {
                i++;
                messages.push(`Guilds (page ${i}):\n`);
            }
            messages[i] += addTo;
        });
        for (i = 0; i < messages.length; i++) {
            bu.send(msg, messages[i]);
        }   
        bu.send(msg, `${gArray.length} guilds total.`);
    }
};