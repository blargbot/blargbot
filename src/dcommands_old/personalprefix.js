const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class PersonalprefixCommand extends BaseCommand {
    constructor() {
        super({
            name: 'personalprefix',
            aliases: ['pprefix'],
            category: newbutils.commandTypes.GENERAL,
            usage: 'personalprefix add|remove [prefix]',
            info: 'Adds or removes a personal prefix.'
        });
    }

    async execute(msg, words, text) {
        let storedUser = await r.table('user').get(msg.author.id);
        if (!storedUser.prefixes) storedUser.prefixes = [];
        if (words.length > 2) {
            let prefix = words.splice(2).join(' ').toLowerCase();
            switch (words[1].toLowerCase()) {
                case 'add':
                case 'set':
                case 'create':
                    if (!storedUser.prefixes.includes(prefix))
                        storedUser.prefixes.push(prefix);
                    await r.table('user').get(msg.author.id).update({
                        prefixes: r.literal(storedUser.prefixes)
                    });
                    await bu.send(msg, 'Your prefix has been added.');
                    break;
                case 'remove':
                case 'delete':
                    storedUser.prefixes = storedUser.prefixes.filter(p => p !== prefix);
                    await r.table('user').get(msg.author.id).update({
                        prefixes: r.literal(storedUser.prefixes)
                    });
                    await bu.send(msg, 'Your prefix has been removed.');
                    break;
            }
        } else {
            if (storedUser.prefixes.length === 0)
                await bu.send(msg, 'You have no personal prefixes.');
            else
                await bu.send(msg, `You have the following personal prefixes:\n${storedUser.prefixes.map(p => ' - ' + p).join('\n')}`);
        }
        //   }
    }
}

module.exports = PersonalprefixCommand;
