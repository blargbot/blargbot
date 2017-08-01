const { AdminCommand } = require('../../../Core/Structures/Command');

class ModCommand extends AdminCommand {
    constructor(client) {
        super(client, {
            name: 'setup',
            subcommands: {
                mute: {
                    aliases: ['mutes', 'muted'],
                    usage: 'setup mute',
                    info: 'Sets up the mute role.'
                },
                announcement: {
                    aliases: ['announcements'],
                    usage: 'setup announcement',
                    info: 'Sets up announcements.'
                },
                staffrole: {
                    aliases: ['staffroles'],
                    usage: 'setup staffrole',
                    info: 'Brings up a dialog to select or deselect staff roles.'
                },
                staffuser: {
                    aliases: ['staffusers'],
                    usage: 'setup staffuser <add | remove> <user>...',
                    info: 'Adds or removes users to the staff list.'
                },
                modlog: {
                    usage: 'setup modlog [#channel] [event]...',
                    info: 'Sets up the modlog for the specified events. If no channel is specified, defaults to the current channel. If no events are specified, defaults to all events.'
                }
            },
            permissions: [
                client.Constants.Permissions.MANAGE_MESSAGES,
                client.Constants.Permissions.ADD_REACTIONS,
                client.Constants.Permissions.EMBED_LINKS
            ],
            keys: {
                staffsetrole: `.staff.setrole`,
                staffrolequery: `.staff.rolequery`,
                mutesetrole: `.mute.setrole`,
                muterolequery: `.mute.rolequery`,
                announceset: { key: `.announce.set`, value: 'Announcements have been set up.' },
                announcerolequery: { key: `.announce.rolequery`, value: 'Select the role that should be pinged for announcements.' },
                announcechannelquery: { key: `.announce.channelquery`, value: 'Select the channel that announcements should go into.' },
                modlogset: { key: '.modlog.set', value: 'The modlog has been set to the current channel with the following events:\n\n{{events}}' },
                modlogsetchannel: { key: '.modlog.setchannel', value: 'The modlog has been set to the channel {{channel}} with the following events:\n\n{{events}}' },
                nochange: 'generic.nochange'
            }
        });
    }

    async execute(ctx) {
        return 'rip';
    }

    get eventList() {
        return ['all', 'kick', 'ban', 'mute', 'unban', 'unmute', 'rename', 'warn', 'pardon', 'custom'];
    }

    async sub_modlog(ctx) {

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
            await ctx.decodeAndSend(this.keys.staffsetrole);
        } catch (err) {
            await ctx.decodeAndSend(this.keys.nochange);
        }
    }
}

module.exports = ModCommand;