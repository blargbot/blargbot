const { Event } = require('../../Core/Structures');

class GuildBanRemove extends Event {
  constructor(client) {
    super(client, 'guildBanRemove');
  }

  async execute(guild, user) {
    let audit = await this.client.Helpers.Modlog.performModlog(guild, 'unban', {
      targetID: user.id
    });
  }
}

module.exports = GuildBanRemove;