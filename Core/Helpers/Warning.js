const BaseHelper = require('./BaseHelper');
const { Op } = require('sequelize');

class WarningHelper extends BaseHelper {
  constructor(client) {
    super(client);
    this.Modlog = this.client.Helpers.Modlog;
    this.Message = this.client.Helpers.Message;
  }

  async giveWarnings(ctx, user, count, reason) {
    let type = 'warn';
    let total = 0;

    let warnings = (await this.client.models.GuildWarning.findOrCreate({
      where: { guildId: ctx.guild.id, userId: user.id }, defaults: { count: 0 }
    }))[0];

    let oldTotal = total = await warnings.get('count');
    total = Math.min(total + count, 9999999);

    await warnings.update({ count: total });

    this.Modlog.performModlog(ctx.guild, type, {
      targetID: user.id,
      user: ctx.author,
      reason, count,
      fields: [
        { name: await this.Message.decode(ctx, 'modlog.warnings.given'), value: count, inline: true },
        { name: await this.Message.decode(ctx, 'modlog.warnings.total'), value: total, inline: true }
      ]
    });

    let punishments = await this.client.models.GuildPunishment.findAll({
      where: {
        guildId: ctx.guild.id, weight: {
          [Op.and]: [{ [Op.gt]: oldTotal }, { [Op.lte]: total }]
        }
      }
    });
    if (punishments.length > 0) {
      let types = ['mute', 'kick', 'ban'];
      let type = 0;
      let time = 0;
      for (const punishment of punishments) {
        let t = await punishment.get('type');
        let d = await punishment.get('duration');
        let i = types.indexOf(t);
        if (i > type) {
          type = i;
          if (d)
            time = d;
        } else if (i === type && (d || 0) > time)
          time = d;
      }


      console.log(types[type], time);
    }
  }

  async givePardons(ctx, user, count, reason) {
    let type = 'pardon';
    let total = 0;

    let warnings = (await this.client.models.GuildWarning.findOrCreate({
      where: { guildId: ctx.guild.id, userId: user.id }, defaults: { count: 0 }
    }))[0];

    let oldTotal = total = await warnings.get('count');
    total = Math.max(total - count, 0);

    await warnings.update({ count: total });

    this.Modlog.performModlog(ctx.guild, type, {
      targetID: user.id,
      user: ctx.author,
      reason, count,
      fields: [
        { name: await this.Message.decode(ctx, 'modlog.warnings.removed'), value: count, inline: true },
        { name: await this.Message.decode(ctx, 'modlog.warnings.total'), value: total, inline: true }
      ]
    });
  }


}

module.exports = WarningHelper;