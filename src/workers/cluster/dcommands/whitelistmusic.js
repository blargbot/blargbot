const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class WhitelistmusicCommand extends BaseCommand {
    constructor() {
        super({
            name: 'whitelistmusic',
            category: newbutils.commandTypes.CAT
        });
    }

    async execute(msg, words, text) {
        if (msg.author.id == config.discord.users.owner) {
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
