const BaseCommand = require('../structures/BaseCommand');

class PrefixCommand extends BaseCommand {
    constructor() {
        super({
            name: 'prefix',
            category: bu.CommandType.ADMIN,
            usage: 'prefix add|remove [prefix] [flags]',
            info: 'Sets the command prefix.',
            flags: [{
                flag: 'd',
                word: 'default',
                desc: 'Sets the provided prefix as the default prefix for the guild.'
            }]
        });
    }

    async execute(msg, words, text) {

        let prefixes = await bu.guildSettings.get(msg.guild.id, 'prefix');
        let input = bu.parseInput(this.flags, words, true);
        if (!prefixes) prefixes = [];
        if (!Array.isArray(prefixes)) prefixes = [prefixes.toLowerCase()];
        if (words.length > 2) {
            let prefix = input.undefined.slice(1).join(' ').toLowerCase();
            switch (input.undefined[0].toLowerCase()) {
                case 'add':
                case 'set':
                case 'create':
                    if (!input.d) {
                        if (!prefixes.includes(prefix))
                            prefixes.push(prefix);
                    } else {
                        prefixes = prefixes.filter(p => p !== prefix);
                        prefixes.unshift(prefix);
                    }
                    await bu.guildSettings.set(msg.guild.id, 'prefix', prefixes);
                    await bu.send(msg, `The prefix has been added${input.d ? ' as a default prefix' : ''}.`);
                    break;
                case 'remove':
                case 'delete':
                    prefixes = prefixes.filter(p => p !== prefix);
                    await bu.guildSettings.set(msg.guild.id, 'prefix', prefixes);
                    await bu.send(msg, 'The prefix has been removed.');
                    break;
            }
        } else {
            if (prefixes.length === 0)
                await bu.send(msg, `${msg.guild.name} has no custom prefixes.`);
            else
                await bu.send(msg, `${msg.guild.name} has the following personal prefixes:\n${prefixes.map(p => ' - ' + p).join('\n')}`);
        }
        //   }
    }
}

module.exports = PrefixCommand;
