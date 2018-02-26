const Context = require('../Structures/Context');
const TagContext = require('../Tag/TagContext');
const Eris = require('eris');
const BaseHelper = require('./BaseHelper');

class ResolveHelper extends BaseHelper {
  constructor(client) {
    super(client);
  }

  async channel(ctx, query, quiet) {
    const { guild, channel, user } = this.generic(ctx);
    query = query.trim();
    let channelList = guild.channels, channelId;
    if (/\d{17,23}/.test(query)) {
      channelId = query.match(/(\d{17,23})/)[0];
      return this.client.getChannel(channelId);
    }
    channelList = channelList.filter(c => {
      return c.name && c.name.toLowerCase().includes(query.toLowerCase());
    });

    channelList.sort((a, b) => {
      return this.sortNames(a.name, b.name, query) + (a.position - b.position);
    });

    if (channelList.length == 1) {
      return channelList[0];
    } else if (channelList.length == 0) {
      if (!quiet)
        await this.client.Helpers.Message.decodeAndSend(ctx, 'generic.resolvechannel.nochannels');
      return null;
    } else {
      try {
        let roleMessage = await this.client.Helpers.Message.decode(ctx, 'generic.resolvechannel.pickchannel', {
          length: channelList.length
        });
        let menu = await this.client.Helpers.Menu.build(ctx);
        menu.embed.setDescription(roleMessage);
        let res = await menu.paginate(channelList.map(c => ({ name: c.name, value: c.id })));

        return this.client.getChannel(res.value);
      } catch (err) {
        if (err == 'Canceled') {
          if (!quiet)
            await this.client.Helpers.Message.decodeAndSend(ctx, 'generic.querycancelled');
          return null;
        } else throw err;
      }
    }
  }

  async role(ctx, query, quiet) {
    const { guild, channel, user } = this.generic(ctx);
    query = query.trim();
    let roleList = guild.roles, roleId;
    if (/\d{17,23}/.test(query)) {
      roleId = query.match(/(\d{17,23})/)[0];
      return guild.roles.get(roleId);
    }
    roleList = roleList.filter(r => {
      return r.name && r.name.toLowerCase().includes(query.toLowerCase());
    });

    roleList.sort((a, b) => {
      return this.sortNames(a.name, b.name, query) + (b.position - a.position);
    });

    if (roleList.length == 1) {
      return roleList[0];
    } else if (roleList.length == 0) {
      if (!quiet)
        await this.client.Helpers.Message.decodeAndSend(ctx, 'generic.resolverole.noroles');
      return null;
    } else {
      try {
        let roleMessage = await this.client.Helpers.Message.decode(ctx, 'generic.resolverole.pickrole', {
          length: roleList.length
        });
        let menu = await this.client.Helpers.Menu.build(ctx);
        menu.embed.setDescription(roleMessage);
        let res = await menu.paginate(roleList.map(r => ({ name: r.name, value: r.id })));

        return guild.roles.get(res.value);
      } catch (err) {
        if (err == 'Canceled') {
          if (!quiet)
            await this.client.Helpers.Message.decodeAndSend(ctx, 'generic.querycancelled');
          return null;
        } else throw err;
      }
    }
  }

  async user(ctx, query, quiet) {
    const { guild, channel, user } = this.generic(ctx);
    let userList = guild.members, userId, userDiscrim;
    query = query.trim();
    if (/\d{17,23}/.test(query)) {
      userId = query.match(/(\d{17,23})/)[0];
      return this.client.users.get(userId);
    }
    if (/^.*#\d{4}$/.test(query)) {
      userDiscrim = query.match(/^.*#(\d{4}$)/)[1];
      query = query.substring(0, query.length - 5);
    }
    if (userDiscrim) {
      userList = userList.filter(u => u.user.discriminator == userDiscrim);
    }
    userList = userList.filter(u => {
      let nameSearch = u.user.username
        && u.user.username.toLowerCase().includes(query.toLowerCase());
      let nickSearch = u.nick
        && u.nick.toLowerCase().includes(query.toLowerCase());
      return nameSearch || nickSearch;
    });
    userList.sort((a, b) => {
      return this.sortNames(a.user.username, b.user.username, query)
        + this.sortNames(a.nick, b.nick, query);
    });

    if (userList.length == 1) {
      return userList[0].user;
    } else if (userList.length == 0) {
      if (!quiet)
        await this.client.Helpers.Message.decodeAndSend(ctx, 'generic.resolveuser.nousers');
      return null;
    } else {
      try {
        let userMessage = await this.client.Helpers.Message.decode(ctx, 'generic.resolveuser.pickuser', {
          length: userList.length
        });
        let menu = await this.client.Helpers.Menu.build(ctx);
        menu.embed.setDescription(userMessage);
        let res = await menu.paginate(userList.map(u => ({ name: u.user.fullName, value: u.user.id })));

        return this.client.users.get(res.value);
      } catch (err) {
        if (err == 'Canceled') {
          if (!quiet)
            await this.client.Helpers.Message.decodeAndSend(ctx, 'generic.querycancelled');
          return null;
        } else throw err;
      }
    }
  }

  sortNames(name1, name2, query) {
    let position = 0;
    position += this.compareNames(name1, query, true, true, -1000);
    position += this.compareNames(name2, query, true, true, 1000);
    position += this.compareNames(name1, query, true, false, -100);
    position += this.compareNames(name2, query, true, false, 100);
    position += this.compareNames(name1, query, false, true, -10);
    position += this.compareNames(name2, query, false, true, 10);
    position += this.compareNames(name1, query, false, false, -1);
    position += this.compareNames(name2, query, false, false, 1);
    return position;
  }

  compareNames(nameOne, nameTwo, caseSensitive, startsWith, multiplicity = 1) {
    let index = false;
    if (nameOne && nameTwo) {
      if (startsWith) {
        if (caseSensitive) {
          index = nameOne.startsWith(nameTwo);
        } else {
          index = nameOne.toLowerCase().startsWith(nameTwo.toLowerCase());
        }
      } else {
        if (caseSensitive) {
          index = nameOne.includes(nameTwo);
        } else {
          index = nameOne.toLowerCase().includes(nameTwo.toLowerCase());
        }
      }
    }
    return index ? multiplicity : 0;
  }

  generic(dest) {
    let user, guild, channel, member;
    if (dest instanceof Eris.Message) {
      user = dest.author;
      guild = dest.guild;
      channel = dest.channel;
      member = dest.member;
    } else if (dest instanceof Eris.User) {
      user = dest;
    } else if (dest instanceof Eris.Member) {
      user = dest.user;
      member = dest;
      guild = dest.guild;
    } else if (dest instanceof Eris.Channel) {
      guild = dest.guild;
      channel = dest;
    } else if (dest instanceof Eris.Guild) {
      guild = dest;
    } else if (dest instanceof TagContext) {
      guild = dest.guild;
      user = dest.user;
      channel = dest.channel;
      member = dest.msg.member;
    } else if (dest instanceof Context) {
      guild = dest.guild;
      user = dest.author;
      channel = dest.channel;
      member = dest.msg.member;
    } else if (typeof dest == 'string') {
      channel = this.client.getChannel(dest);
      guild = channel.guild;
    }
    return { user, channel, guild, member };
  }

  async  destination(dest) {
    let { user, guild, channel } = this.generic(dest);
    let channelToSend;
    if (channel != undefined) {
      channelToSend = channel;
    } else if (user != undefined) {
      channelToSend = await user.getDMChannel();
    } else if (guild != undefined) {
      channelToSend = this.client.getChannel(guild.id);
    }
    return channelToSend;
  }
}


module.exports = ResolveHelper;