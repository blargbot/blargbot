const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class RvotebanCommand extends BaseCommand {
    constructor() {
        super({
            name: 'rvoteban',
            aliases: ['rpollban', 'removevoteban', 'removepollban', 'rvb', 'rpb'],
            category: newbutils.commandTypes.ADMIN,
            usage: 'rvoteban (<user> | <flags>)',
            info: 'Removes the votebans for a specific user, or removes all votebans completely.',
            flags: [{ flag: 'a', word: 'all', desc: 'Removes all votebans' }]
        });
    }

    async execute(msg, words) {
        let storedGuild = await bu.getGuild(msg.guild.id);
        let votebans = storedGuild.votebans || {};
        let input = newbutils.parse.flags(this.flags, words);
        if (input.a) {
            let msg2 = await bu.awaitQuery(msg, 'This will remove all the votebans on this guild. Type `yes` to confirm, or anything else to cancel.');
            if (msg2.content.toLowerCase() == 'yes' || msg2.content.toLowerCase() == 'y') {
                await r.table('guild').get(msg.guild.id).update({
                    votebans: r.literal({})
                });
                await bu.send(msg, 'Removed all votebans!');
            } else {
                await bu.send(msg, 'Nothing was removed.');
            }
        } else if (input.undefined.length > 0) {
            let user = await bu.getUser(msg, input.undefined.join(' '));
            if (!user) return;
            delete votebans[user.id];
            await r.table('guild').get(msg.guild.id).update({
                votebans: r.literal(votebans)
            });
            await bu.send(msg, 'Removed all of the petitions against **' + bu.getFullName(user) + '**!');
        } else {
            await bu.send(msg, 'Not enough arguments! Do `b!help rvoteban` for more details.');
        }
    }
}

module.exports = RvotebanCommand;
