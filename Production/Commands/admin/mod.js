const { AdminCommand } = require('../../../Core/Structures/Command');

class ModCommand extends AdminCommand {
    constructor(client) {
        super(client, {
            name: 'mod',
            subcommands: {
                user: { minArgs: 2 },
                role: {}
            },
            permissions: [
                client.Constants.Permissions.MANAGE_MESSAGES,
                client.Constants.Permissions.ADD_REACTIONS,
                client.Constants.Permissions.EMBED_LINKS
            ],
            keys: {
                setrole: `.setstaffrole`,
                rolequery: `.rolequery`,
                nochange: 'generic.nochange'
            }
        });
    }

    async execute(ctx) {
        const msg2 = await ctx.decodeAndSend(this.keys.randmsg);
        await msg2.edit(await ctx.decode(this.keys.final, { time: msg2.timestamp - ctx.msg.timestamp }));
    }

    async sub_user(ctx) {

    }


}

module.exports = ModCommand;