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

    async execute(msg) {
        const sortedRoles = msg.guild.roles.filter(() => true)
            .sort((a, b) => b.position - a.position)
            .map(r => r.id + ' ' + r.name)
            .join('\n');

        bu.send(msg, `The roles in **${msg.guild.name}**
\`\`\`prolog
${sortedRoles}
\`\`\``);
    }
}

module.exports = RolesCommand;
