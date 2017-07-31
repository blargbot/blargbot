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
                setstaffrole: `.setstaffrole`,
                staffrolequery: `.staffrolequery`,
                mutesetrole: `.mute.setrole`,
                muterolequery: `.mute.rolequery`,
                announceset: `.announce.set`,
                announcerolequery: `announce.rolequery`,
                announcechannelquery: `announce.channelquery`,
                nochange: 'generic.nochange'
            }
        });
    }

    async execute(ctx) {
        return 'rip';
    }

    async sub_mute(ctx) {
        let menu = this.client.Helpers.Menu.build(ctx);
        let data = ctx.guild.data;

        let roles = ctx.guild.roles.map(r => r).sort((a, b) => {
            return b.position - a.position;
        }).map(r => {
            return {
                name: `${r.name} (#${r.color.toString(16)})`,
                value: r.id
            };
        });
        try {
            menu.embed.setDescription(await ctx.decode(this.keys.muterolequery));
            let selected = await menu.paginate(roles, false);
            await data.setKey('mutedRole', selected.value);
            await ctx.decodeAndSend(this.keys.mutesetrole);
        } catch (err) {
            console.error(err);
            await ctx.decodeAndSend(this.keys.nochange);
        }
    }

    async sub_announcement(ctx) {
        let menu = this.client.Helpers.Menu.build(ctx);
        let data = ctx.guild.data;

        let channels = ctx.guild.channels.map(r => r).sort((a, b) => {
            return a.position - b.position;
        }).map(r => {
            return {
                name: `<#${r.id}>`,
                value: r.id
            };
        });

        let roles = ctx.guild.roles.map(r => r).sort((a, b) => {
            return b.position - a.position;
        }).map(r => {
            return {
                name: `${r.name} (#${r.color.toString(16)})`,
                value: r.id
            };
        });

        try {
            menu.embed.setDescription(await ctx.decode(this.keys.announcechannelquery));
            let selectedChannel = await menu.paginate(channels, false);
            menu = this.client.Helpers.Menu.build(ctx);
            menu.embed.setDescription(await ctx.decode(this.keys.announcerolequery));
            let selectedRole = await menu.paginate(roles, false);
            await data.setKey('announcementChannel', selectedChannel.value);
            await data.setKey('announcementRole', selectedRole.value);
            await ctx.decodeAndSend(this.keys.announceset);
        } catch (err) {
            console.error(err);
            await ctx.decodeAndSend(this.keys.nochange);
        }
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
            menu.embed.setDescription(await ctx.decode(this.keys.staffrolequery));
            let selected = await menu.paginate(roles, true);
            await data.setKey('staffRoles', selected);
            await ctx.decodeAndSend(this.keys.setstaffrole);
        } catch (err) {
            await ctx.decodeAndSend(this.keys.nochange);
        }
    }
}

module.exports = ModCommand;