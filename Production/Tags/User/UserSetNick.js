const { User } = require.main.require('./Tag/Classes');

class UserSetNick extends User {
  constructor(client) {
    super(client, {
      name: 'setnick',
      args: [
        {
          name: 'nick'
        },
        {
          name: 'user',
          optional: true
        }
      ],
      minArgs: 1, maxArgs: 2,
      ccommand: true, requiresStaff: true,
      permissions: [client.Constants.Permissions.MANAGE_NICKNAMES]
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args);
    let user = ctx.user, member;
    let nick;
    if (args.parsedArgs.nick) {
      user = await ctx.client.Helpers.Resolve.user(ctx, args.parsedArgs.user.toString(), true);
      nick = args.parsedArgs.nick;
    } else nick = args.parsedArgs.user;
    if (user) {
      member = ctx.guild.members.get(user.id);
      if (!member) throw new this.TagError('error.memberundef', {
        member: args.parsedArgs.user
      });
      try {
        await member.edit({
          nick: nick.join('')
        });
      } catch (err) {
        throw new this.TagError('error.tag.toolow', {
          target: member.user.fullName,
          tag: this.name
        });
      }
    }
    return res;
  }
}

module.exports = UserSetNick;