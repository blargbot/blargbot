const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class GetguildsCommand extends BaseCommand {
    constructor() {
        super({
            name: 'getguilds',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id === config.discord.users.owner) {
            var gArray;
            var botRatio = false;
            if (words[1]) {
                if (words[1].toLowerCase() == 'bots') {
                    gArray = bot.guilds.filter(m => m.memberCount > 20 && m.members.filter(m2 => m2.user.bot).length / m.memberCount > 0.5);
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
    }
}

module.exports = GetguildsCommand;
