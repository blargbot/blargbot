const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class RolesCommand extends BaseCommand {
    constructor() {
        super({
            name: 'roles',
            category: newbutils.commandTypes.GENERAL,
            usage: 'roles',
            info: '<p>Displays a list of roles and their IDs.</p>'
        });
    }

    async execute(msg, words, text) {
        var output;
        bu.send(msg, `The roles in **${msg.guild.name}**
\`\`\`prolog
${msg.guild.roles.filter(a => true).sort((a, b) => {
        return b.position - a.position;
    }).map(r => r.id + ' ' + r.name).join('\n')}
\`\`\``);
    }
}

module.exports = RolesCommand;
