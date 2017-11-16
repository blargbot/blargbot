const { GeneralCommand } = require('../../../Core/Structures/Command');
const moment = require('moment');

class UserCommand extends GeneralCommand {
  constructor(client) {
    super(client, {
      name: 'user',
      info: 'Returns information about the specified user.',
      usage: '[user]',
      keys: {
        description: {
          key: '.description', value: `**Username**: {{username}}
**Discriminator**: {{discriminator}}
**ID**: {{id}}
**Bot**: {{bot}}
**Created**: {{created}}
[Avatar]({{avatar}})`},
        guildinfoheader: { key: '.guildinfoheader', value: 'Guild Information' },
        guildinfo: {
          key: '.guildinfo', value: `**Nickname**: {{nick}}
**Permissions**: {{permissions}}
**Status**: {{status}}
**Joined**: {{joined}}
{{game}}`},
        status: {
          key: '.status',
          value: [
            'Playing', 'Streaming', 'Listening to', 'Watching'
          ]
        }
      }
    });
  }

  async execute(ctx) {
    let embed = this.client.Helpers.Embed.build(ctx);
    let user;
    if (ctx.input._.length > 0)
      user = await this.client.Helpers.Resolve.user(ctx, ctx.input._.raw.join(''));
    if (!user) user = ctx.author;

    embed.setTitle(user.fullName)
      .setImage(user.avatarURL)
      .setTimestamp(moment(user.createdAt))
      .setDescription(await ctx.decode(this.keys.description, {
        username: user.username,
        discriminator: user.discriminator,
        id: user.id,
        bot: user.bot,
        avatar: user.avatarURL,
        created: moment(user.createdAt).format('LLLL') + ` (${(moment.duration(user.createdAt - moment()).humanize(true))})`
      }));
    let member = ctx.guild.members.get(user.id);
    if (member !== undefined) {
      let gameType = '';
      if (member.game) {
        gameType = await ctx.decode(this.base + '.status.' + member.game.type);
      }
      embed.addField(await ctx.decode(this.keys.guildinfoheader), await ctx.decode(this.keys.guildinfo, {
        nick: member.nick || user.username,
        permissions: member.permission.allow,
        status: member.status,
        game: !member.game ? '' : '\n' + gameType + ' ' + member.game.name,
        joined: moment(member.joinedAt).format('LLLL') + ` (${(moment.duration(member.joinedAt - moment()).humanize(true))})`
      }));
    }
    return await embed.send();
  }
}

module.exports = UserCommand;