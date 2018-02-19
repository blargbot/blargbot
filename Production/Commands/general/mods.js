const { GeneralCommand } = require('../../../Core/Structures/Command');

class ModsCommand extends GeneralCommand {
  constructor(client) {
    super(client, {
      name: 'mods',
      keys: {
        mods: { key: '.mods', value: 'Mods on **{{guild}}**' },
        nomods: { key: '.nomods', value: 'There are no mods on this guild.' },
        nomodsstatus: { key: '.nomodsonline', value: 'There are no online mods.' }
      },
      aliases: ['staff']
    });
  }

  get online() { return '<:statusOnline:372798973867720715>'; }
  get away() { return '<:statusIdle:372798973880041484>'; }
  get dnd() { return '<:statusDnd:372798973359947777>'; }
  get offline() { return '<:statusOffline:372798973930635274>'; }

  sortUsers(a, b) { return a.user.fullNameEscaped.toLowerCase() > b.user.fullNameEscaped.toLowerCase(); }

  async execute(ctx) {
    let guild = await ctx.guild.data.getOrCreateObject();
    let roles = await guild.get('staffRoles');
    let staffPerms = await guild.get('staffPerms');

    const mods = (await Promise.filter(ctx.channel.guild.members, async m => {
      if (m[1].bot) return false;
      return await ctx.checkStaff(m[0], false, roles, staffPerms);
    }))
      .map(m => m[1]);
    if (mods.length === 0)
      return await ctx.decodeAndSend(this.keys.nomods);

    let online = mods.filter(m => m.status === 'online').sort(this.sortUsers);
    let offline = mods.filter(m => m.status === 'offline').sort(this.sortUsers);
    let away = mods.filter(m => m.status === 'idle').sort(this.sortUsers);
    let dnd = mods.filter(m => m.status === 'dnd').sort(this.sortUsers);
    let onlineOnly = false;
    if (ctx.input._[0] && ['o', 'online'].includes(ctx.input._[0].toLowerCase())) {
      onlineOnly = true;
    }

    if (onlineOnly && online.length === 0)
      return await ctx.decodeAndSend(this.keys.nomodsstatus);

    let msg = await ctx.decode(this.keys.mods, { guild: ctx.guild.name }) + '\n';
    let arrs = [];
    if (online.length > 0)
      arrs.push(this.online + ' ' + online.map(m => `**${m.user.fullNameEscaped}**`).join(', '));
    if (!onlineOnly) {
      if (away.length > 0)
        arrs.push(this.away + ' ' + away.map(m => `**${m.user.fullNameEscaped}**`).join(', '));
      if (dnd.length > 0)
        arrs.push(this.dnd + ' ' + dnd.map(m => `**${m.user.fullNameEscaped}**`).join(', '));
      if (offline.length > 0)
        arrs.push(this.offline + ' ' + offline.map(m => `**${m.user.fullNameEscaped}**`).join(', '));
    }
    msg += arrs.filter(m => m.length > 0).join('\n');
    return await ctx.send(msg);
  }
}

module.exports = ModsCommand;
