const { AdminCommand } = require('../../../Core/Structures/Command');

class SetupCommand extends AdminCommand {
  constructor(client) {
    super(client, {
      name: 'setup',
      aliases: ['s', 'settings'],
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
        },
        punishment: {
          aliases: ['punishments'],
          usage: 'punishment <add | remove> <weight> [ban | mute | kick]',
          info: 'Adds or remove a warning punishment. `weight` refers to the number of warnings required to activate the punishment.',
          flags: [
            { flag: 'k', name: 'kick', info: 'Specifies that the punishment is to kick. Cannot be used with mute or ban.' },
            { flag: 'b', name: 'ban', info: 'Specifies that the punishment is to ban. Cannot be used with mute or kick.' },
            { flag: 'm', name: 'mute', info: 'Specifies that the punishment is to mute. Cannot be used with kick or ban.' },
            { flag: 't', name: 'time', info: 'Specifies how long a ban or mute should last for.' },
            { flag: 'l', name: 'list', info: 'Lists the active punishments.' }
          ]
        }
      },
      permissions: [
        client.Constants.Permissions.MANAGE_MESSAGES,
        client.Constants.Permissions.ADD_REACTIONS,
        client.Constants.Permissions.EMBED_LINKS
      ],
      keys: {
        staffsetrole: { key: `.staff.setrole`, value: 'The staff roles have been updated.' },
        staffrolequery: { key: `.staff.rolequery`, value: 'Select the roles that will be considered moderator roles. Users with these roles will be able to use admin commands.' },
        mutesetrole: { key: `.mute.setrole`, value: 'The muted role has been updated.' },
        muterolequery: { key: `.mute.rolequery`, value: 'Select the muted role. The current role is: {{current}}' },
        announceset: { key: `.announce.set`, value: 'Announcements have been set up.' },
        announcerolequery: { key: `.announce.rolequery`, value: 'Select the role that should be pinged for announcements.' },
        announcechannelquery: { key: `.announce.channelquery`, value: 'Select the channel that announcements should go into.' },
        modlogset: { key: '.modlog.set', value: 'The modlog has been set to the channel {{channel}} with the following events:\n```\n{{events}}\n```\n{{hadInvalid}}' },
        modlogremove: { key: '.modlog.remove', value: 'The modlog for the following events has been removed:\n```\n{{events}}\n```\n{{hadInvalid}}' },
        modloginvalid: { key: '.modlog.invalid', value: 'No valid events were provided. The list of valid events is:\n```\n{{eventList}}\n```' },
        modloghadinvalid: { key: '.modlog.hadinvalid', value: 'You had some invalid events in your command. The list of valid events is:\n```\n{{eventList}}\n```' },
        modloglist: { key: '.modlog.list', value: 'Here are the modlogs that are active on your guild:\n\n{{events}}' },
        nochange: 'generic.nochange',
        punishmentTooLow: { key: '.punishment.toolow', value: 'The provided weight must be greater than 0.' },
        punishmentInvalidWeight: { key: '.punishment.invalidweight', value: 'You must provide a number for the weight.' },
        punishmentInvalidChoice: { key: '.punishment.invalidchoice', value: 'You must specify whether you are adding or removing a punishment.' },
        punishmentInvalidTypes: { key: '.punishment.invalidtypes', value: 'Invalid types were specified. Only one of `--mute`, `--kick`, or `--ban` may be provided.' },
        punishmentAdded: { key: '.punishment.added', value: 'A punishment has been added with a weight of **{{weight}}**.' },
        punishmentRemoved: { key: '.punishment.removed', value: 'The punishment with a weight of **{{weight}}** has been removed.' },
        punishmentOverwritten: { key: '.punishment.overwritten', value: 'The punishment with a weight of **{{weight}}** has been overwritten.' },
        punishmentDoesntExist: { key: '.punishment.doesntexist', value: 'A punishment with a weight of **{{weight}}** doesn\'t exist.' },
        punishmentList: { key: '.punishment.list', value: 'These are the punishments active on your guild:\n\n{{list}}' }
      }
    });
  }

  async execute(ctx) {
    return 'rip';
  }

  get eventList() {
    return Object.keys(this.client.Helpers.Modlog.eventMap);
  }

  async sub_punishment(ctx) {
    let GuildPunishment = this.client.models.GuildPunishment;

    if (ctx.input.l) {
      let punishments = await GuildPunishment.findAll({ where: { guildId: ctx.guild.id }, order: ['weight'] });
      let list = '';
      for (const punishment of punishments) {
        let dur = await punishment.get('duration');
        list += `**${await punishment.get('weight')}**. ${await punishment.get('type')}${dur ? ` (${dur / 1000}s)` : ''}\n`;
      }
      return await ctx.decodeAndSend(this.keys.punishmentList, { list });
    }
    let weight = parseInt(ctx.input._[1]);

    switch (ctx.input._[0].toLowerCase()) {
      case 'add':
      case 'set': {
        if (isNaN(weight))
          return await ctx.decodeAndSend(this.keys.punishmentInvalidWeight);
        if (weight <= 0)
          return await ctx.decodeAndSend(this.keys.punishmentTooLow);

        let type;
        if ((ctx.input.m && !ctx.input.b && !ctx.input.k) || ctx.input._[2].toLowerCase() === 'mute') {
          type = 'mute';
        } else if ((!ctx.input.m && ctx.input.b && !ctx.input.k) || ctx.input._[2].toLowerCase() === 'ban') {
          type = 'ban';
        } else if ((!ctx.input.m && !ctx.input.b && ctx.input.k) || ctx.input._[2].toLowerCase() === 'kick') {
          type = 'kick';
        } else {
          return await ctx.decodeAndSend(this.keys.punishmentInvalidTypes);
        }
        let time = null;
        if (ctx.input.t)
          time = this.client.Helpers.Time.parseDuration(ctx.input.t.raw.join('')).asMilliseconds();

        let punishment = await GuildPunishment.find({ where: { guildId: ctx.guild.id, weight } });
        if (punishment) {
          await punishment.update({
            duration: time,
            type
          });
          return await ctx.decodeAndSend(this.keys.punishmentOverwritten, { weight });
        } else {
          await GuildPunishment.create({
            guildId: ctx.guild.id,
            weight,
            duration: time,
            type
          });
          return await ctx.decodeAndSend(this.keys.punishmentAdded, { weight });
        }
        break;
      }
      case 'remove':
      case 'delete': {
        if (isNaN(weight))
          return await ctx.decodeAndSend(this.keys.punishmentInvalidWeight);
        if (weight <= 0)
          return await ctx.decodeAndSend(this.keys.punishmentTooLow);

        let punishment = await GuildPunishment.find({ where: { guildId: ctx.guild.id, weight } });
        if (punishment) {
          await punishment.destroy();
          return await ctx.decodeAndSend(this.keys.punishmentRemoved, { weight });
        } else {
          return await ctx.decodeAndSend(this.keys.punishmentDoesntExist, { weight });
        }
        break;
      }
      default:
        return await ctx.decodeAndSend(this.keys.punishmentInvalidChoice);
        break;
    }
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
      let currentRole = await data.getKey('mutedRole');
      if (currentRole) currentRole = `<@&${currentRole}>`;
      else currentRole = 'N/A';
      menu.embed.setDescription(await ctx.decode(this.keys.muterolequery, { current: currentRole }));
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

module.exports = SetupCommand;