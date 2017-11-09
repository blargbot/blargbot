const { AdminCommand } = require('../../../Core/Structures/Command');

class ModCommand extends AdminCommand {
    constructor(client) {
        super(client, {
            name: 'setup',
            subcommands: {
                mute: {
                    aliases: ['mutes', 'muted'],
                    info: 'Sets up the mute role.'
                },
                announcement: {
                    aliases: ['announcements'],
                    info: 'Sets up announcements.'
                },
                staffrole: {
                    aliases: ['staffroles'],
                    info: 'Brings up a dialog to select or deselect staff roles.'
                },
                staffuser: {
                    aliases: ['staffusers'],
                    usage: 'staffuser <add | remove> <user>...',
                    info: 'Adds or removes users to the staff list.'
                },
                modlog: {
                    usage: 'modlog [event]...',
                    info: 'Sets up the modlog for the specified events. If no channel is specified, defaults to the current channel. If no events are specified, defaults to all events.',
                    flags: [
                        { flag: 'c', name: 'channel', info: 'Specifies which channel the modlog should be put in.' },
                        { flag: 'r', name: 'remove', info: 'Specifies that the modlog should be removed instead of added.' },
                        { flag: 'l', name: 'list', info: 'Return a list of configured modlogs.' }
                    ]
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
                modlogset: { key: '.modlog.set', value: 'The modlog has been set to the channel {{channel}} with the following events:\n```\n{{events}}\n```\n{{hadInvalid}}' },
                modlogremove: { key: '.modlog.remove', value: 'The modlog for the following events has been removed:\n```\n{{events}}\n```\n{{hadInvalid}}' },
                modloginvalid: { key: '.modlog.invalid', value: 'No valid events were provided. The list of valid events is:\n```\n{{eventList}}\n```' },
                modloghadinvalid: { key: '.modlog.hadinvalid', value: 'You had some invalid events in your command. The list of valid events is:\n```\n{{eventList}}\n```' },
                modloglist: { key: '.modlog.list', value: 'Here are the modlogs that are active on your guild:\n\n{{events}}' },
                nochange: 'generic.nochange'
            }
        });
    }

    async execute(ctx) {
        return 'rip';
    }

    get eventList() {
        return Object.keys(this.client.Helpers.Modlog.eventMap);
    }

    async sub_modlog(ctx) {
        if (ctx.input.l) {
            let channels = await ctx.guild.data.getModlogChannels();
            let output = '';
            for (const channel of channels) {
                output += ` - ${await channel.get('type')}: <#${await channel.get('channel')}>\n`;
            }
            await ctx.decodeAndSend(this.keys.modloglist, {
                events: output
            });
        } else {
            let channel = ctx.channel.id;
            if (ctx.input.c) {
                channel = (await this.client.Helpers.Resolve.channel(ctx, ctx.input.c.raw.join('')));
                if (channel) channel = channel.id;
                else return;
            }
            let hadInvalid = false;
            let events = [];
            if (ctx.input._.length > 0)
                for (let arg of ctx.input._) {
                    arg = arg.toLowerCase().trim();
                    if (arg === 'all' || arg === 'default' || arg === '*') arg = 'default';
                    if (this.eventList.includes(arg)) events.push(arg);
                    else hadInvalid = true;
                }
            else events.push('default');

            if (events.length === 0) {
                await ctx.decodeAndSend(this.keys.modloginvalid, {
                    events: this.eventList.join(', ')
                });
            } else {
                let invalidMessage = '';
                if (hadInvalid)
                    invalidMessage = await ctx.decode(this.keys.modloghadinvalid, {
                        eventList: this.eventList.join(', ')
                    });

                for (const event of events) {
                    if (ctx.input.r)
                        await ctx.guild.data.removeModlogChannel(event);
                    else
                        await ctx.guild.data.setModlogChannel(event, channel);
                }

                await ctx.decodeAndSend(!ctx.input.r ? this.keys.modlogset : this.keys.modlogremove, {
                    hadInvalid: invalidMessage,
                    events: events.join(', '),
                    channel: `<#${channel}>`
                });
            }
        }
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