const { Event } = require('../../Core/Structures');

class GuildBanAdd extends Event {
  constructor(client) {
    super(client, 'guildBanAdd');
  }

  async execute(guild, user) {
    let audit = await this.client.Helpers.Modlog.performModlog(guild, 'ban', {
      targetID: user.id
    });
  }
}

module.exports = GuildBanAdd;