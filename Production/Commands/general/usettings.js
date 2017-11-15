const { GeneralCommand } = require('../../../Core/Structures/Command');

class UserSettingsCommand extends GeneralCommand {
  constructor(client) {
    super(client, {
      name: 'usettings',
      aliases: ['usersettings'],
      info: 'Modifies or displays your user settings.',
      keys: {
        dmerrorsenabled: { key: '.dmerrorsenabled', value: 'DM error notifications have been enabled.' },
        dmerrorsdisabled: { key: '.dmerrorsdisabled', value: 'DM error notifications have been disabled.' },
        userinfo: { key: '.userinfo', value: 'Here are your user settings:\n\n{{settings}}\n\nAvailable subcommands: {{sub}}' }
      },
      subcommands: {
        dmerrors: {
          info: 'Enables or disables DMs for error notifications.',
          usage: '[true|false]'
        }
      }
    });
  }

  async execute(ctx) {
    let settings = `**DM Errors**: ${await ctx.author.data.getKey('dmErrors')}
**Prefixes**: [ ${(await ctx.author.data.getPrefixes()).join(' | ')}]`;

    return await ctx.decodeAndSend(this.keys.userinfo, { settings, sub: Object.keys(this.subcommands).map(s => '`' + s + '`').join(' | ') });
  }

  async sub_dmerrors(ctx) {
    let dmErrors = await ctx.author.data.getKey('dmErrors');
    if (ctx.input._[0] && ctx.input._[0].toLowerCase() === 'true')
      dmErrors = true;
    else if (ctx.input._[0] && ctx.input._[0].toLowerCase() === 'false')
      dmErrors = false;
    else dmErrors = !dmErrors;

    await ctx.author.data.setKey('dmErrors', dmErrors);
    return await ctx.decodeAndSend(dmErrors ? this.keys.dmerrorsenabled : this.keys.dmerrorsdisabled);
  }
}

module.exports = UserSettingsCommand;