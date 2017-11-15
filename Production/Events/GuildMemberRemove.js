const { Event } = require('../../Core/Structures');

class GuildMemberRemove extends Event {
  constructor(client) {
    super(client, 'guildMemberRemove');
  }

  async execute(guild, user) {
    let audit = await this.client.Helpers.Modlog.performModlog(guild, 'kick', {
      targetID: user.id
    });
  }
}

module.exports = GuildMemberRemove;