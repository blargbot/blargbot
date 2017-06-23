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
                setrole: `.setrole`,
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

    async sub_role(ctx) {
        let menu = this.client.Helpers.Menu.build(ctx);
        let data = ctx.guild.data;

        let staffRoles = await data.getKey('staffRoles');

        let roles = ctx.guild.roles.map(r => r).sort((a, b) => {
            return b.position - a.position;
        }).map(r => {
            return {
                name: `${r.name} (#${r.color.toString(16)})`,
                value: r.id,
                selected: staffRoles.includes(r.id)
            };
        });
        try {
            menu.embed.setDescription(await ctx.decode(this.keys.rolequery));
            let selected = await menu.paginate(roles, true);
            await data.setKey('staffRoles', selected);
            await ctx.decodeAndSend(this.keys.setrole);
        } catch (err) {
            await ctx.decodeAndSend(this.keys.nochange);
        }
    }
}

module.exports = ModCommand;