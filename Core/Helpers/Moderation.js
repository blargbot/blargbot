const BaseHelper = require('./BaseHelper');
const { Op } = require('sequelize');

class ModerationHelper extends BaseHelper {
  constructor(client) {
    super(client);

    this.Modlog = this.client.Helpers.Modlog;
  }

  get Status() {
    return {
      MOD_POSITION_TOO_LOW: 1,
      MOD_HAS_NO_PERMS: 2,
      INVALID_DURATION: 3,
      CANT_TOUCH_OWNER: 4
    };
  }

  resolveBasic({ guild, user, mod = this.client.user, reason = '', time, days }) {
    if (typeof guild === 'string')
      guild = this.client.guilds.get(guild);
    let userId = user.id || user;
    user = guild.members.get(userId);
    mod = guild.members.get(mod.id || mod);
    if (mod.id !== this.client.user.id)
      reason = `[${mod.user.fullName}] ` + reason;
    return { guild, user, mod, reason, time, userId, days };
  }

  async kick(args) {
    let { guild, user, mod, reason } = this.resolveBasic(args);

    if (mod.position <= user.position)
      return { valid: false, status: this.Status.MOD_POSITION_TOO_LOW };
    if (guild.ownerId === user.id)
      return { valid: false, status: this.Status.CANT_TOUCH_OWNER };

    await guild.kickMember(user.id, reason);

    return { valid: true };
  }

  async ban(args) {
    let { guild, user, mod, reason, time, userId, days } = this.resolveBasic(args);
    let hack = false;
    hack = !user;

    if (!hack && mod.position <= user.position)
      return { valid: false, status: this.Status.MOD_POSITION_TOO_LOW };
    if (guild.ownerId === userId)
      return { valid: false, status: this.Status.CANT_TOUCH_OWNER };

    await guild.banMember(userId, days, reason);
    console.log(userId);

    if (time) {
      this.client.Helpers.Event.create({ guild: guild.id, end: time, type: 'unban', data: { userId } });
    }

    return { valid: true };
  }

  async unban(args) {
    let { guild, mod, reason, userId } = this.resolveBasic(args);

    console.log(userId);

    await guild.unbanMember(userId, reason);
    return { valid: true };
  }

  async mute(args) {
    let { guild, user, mod, reason, time } = this.resolveBasic(args);

    let role = await guild.data.getKey('mutedRole');
    await user.addRole(role, reason);

    if (time) {
      this.client.Helpers.Event.create({ guild: guild.id, end: time, type: 'unmute', data: { userId: user.id } });
    }

    return { valid: true };
  }

  async unmute(args) {
    let { guild, user, mod, reason } = this.resolveBasic(args);
    let role = await guild.data.getKey('mutedRole');
    await user.removeRole(role, reason);

    return { valid: true };
  }

}

module.exports = ModerationHelper;