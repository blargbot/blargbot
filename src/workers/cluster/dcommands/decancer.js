const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class DecancerCommand extends BaseCommand {
    constructor() {
        super({
            name: 'decancer',
            category: newbutils.commandTypes.GENERAL,
            usage: 'decancer <user | text>',
            info: 'Decancerify\'s the user\'s nickname/username, or the provided text, to simple ASCII.'
        });
    }

    async execute(msg, words) {
        let text = words.slice(1).join(' ');
        let member;
        if (/\d{17,21}/.test(words[1])) {
            let user = await bu.getUser(msg, words[1]);
            if (user) {
                member = msg.guild.members.get(user.id);
                if (member) text = member.nick || member.user.username;
                else text = user.username;
            }
        }
        let original = text;
        let isStaff = await bu.isUserStaff(msg.author.id, msg.guild.id);
        let nickChanged = false;
        let output = '';
        text = bu.decancer(text);
        if (isStaff && member) {
            try {
                await member.edit({ nick: text }, 'Decancer');
                nickChanged = true;
            } catch (err) {
                // NOOP
            }
        }
        if (nickChanged)
            output = `Successfully decancered **${bu.getFullName(member.user)}**'s name to: \`${text}\``;
        else
            output = `The decancered version of **${original}** is: \`${text}\``;
        await bu.send(msg, output);
    }
}

module.exports = DecancerCommand;
