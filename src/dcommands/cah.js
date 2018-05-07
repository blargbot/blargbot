const BaseCommand = require('../structures/BaseCommand');

var cah = {};
var cad = {};

class CahCommand extends BaseCommand {
    constructor() {
        super({
            name: 'cah',
            category: bu.CommandType.IMAGE,
            usage: 'cah',
            info: 'Generates a set of CAH cards.'
        });
    }

    async execute(msg, words, text) {
        let val = await bu.guildSettings.get(msg.channel.guild.id, 'cahnsfw');
        let cont = true;
        if (val && val != 0) {
            cont = await bu.isNsfwChannel(msg.channel.id);
        }

        if (cont) {
            doit(msg, words);
        } else
            bu.send(msg, config.general.nsfwMessage);
    }
}

module.exports = CahCommand;
