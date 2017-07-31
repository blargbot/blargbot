const { AdminCommand } = require('../../../Core/Structures/Command');

class ModCommand extends AdminCommand {
    constructor(client) {
        super(client, {
            name: 'setup',
            subcommands: {
                mute: { aliases: ['mutes', 'muted'] },
                announcement: { aliases: ['announcements'] },
                staffrole: { aliases: ['staffroles'] },
                staffuser: { aliases: ['staffusers'] }
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
        return 'rip';
    }

    async sub_mute(ctx) {
        return 'mute';
    }

    async sub_announcement(ctx) {
        return 'announcement';
    }

    async sub_staffuser(ctx) {

    }

    async sub_staffrole(ctx) {
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