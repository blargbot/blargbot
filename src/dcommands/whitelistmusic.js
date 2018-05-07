const BaseCommand = require('../structures/BaseCommand');

class WhitelistmusicCommand extends BaseCommand {
    constructor() {
        super({
            name: 'whitelistmusic',
            category: bu.CommandType.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == bu.CAT_ID) {
            if (config.discord.musicGuilds[msg.channel.guild.id]) {
                config.discord.musicGuilds[msg.channel.guild.id] = false;
                bu.send(msg, `Music disabled for ${msg.channel.guild.name}`);
            } else {
                config.discord.musicGuilds[msg.channel.guild.id] = true;
                bu.send(msg, `Music enabled for ${msg.channel.guild.name}`);
            }
        }
        bu.saveConfig();
    }
}

module.exports = WhitelistmusicCommand;
