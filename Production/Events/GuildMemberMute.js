const { Event } = require('../../Core/Structures');

class GuildMemberRemove extends Event {
  constructor(client) {
    super(client, 'guildMemberUpdate');
  }

  async execute(guild, member, oldMember) {
    let role = await guild.data.getKey('mutedRole');
    if (role) {
      let type;
      if (member.roles.includes(role) && !oldMember.roles.includes(role))
        type = 'mute';
      else if (!member.roles.includes(role) && oldMember.roles.includes(role))
        type = 'unmute';

      if (type) {
        let audit = await this.client.Helpers.Modlog.performModlog(guild, type, {
          targetID: member.id
        });
      }
    }

  }
}

module.exports = GuildMemberRemove;