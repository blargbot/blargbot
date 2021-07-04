const BaseCommand = require('../structures/BaseCommand');
const newbutils = require('../newbu');

class AddDomainCommand extends BaseCommand {
    constructor() {
        super({
            name: 'adddomain',
            category: newbutils.commandTypes.CAT,
            aliases: ['addomain']
        });
    }

    async execute(msg, words) {
        if (msg.author.id !== config.discord.users.owner) return;
        let whitelist = await r.table('vars').get('whitelistedDomains');
        let res = { a: [], r: [] };
        for (let domain of words.slice(1)) {
            domain = domain.toLowerCase();
            whitelist.values[domain] = !whitelist.values[domain];
            res[whitelist.values[domain] ? 'a' : 'r'].push(domain);
        }
        let output = 'Boy howdy, thanks for the domains!\n';
        if (res.a.length > 0)
            output += `These ones are great!\`\`\`${res.a.join('\n')}\`\`\``;
        if (res.r.length > 0)
            output += `I always hated these ones anyways.\`\`\`${res.r.join('\n')}\`\`\``;
        output += 'Just remember: it might take up to 15 minutes for these to go live.';

        await r.table('vars').get('whitelistedDomains').update(whitelist);
        await bu.send(msg, output);
    }
}

module.exports = AddDomainCommand;
