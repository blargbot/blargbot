const { Event } = require('../../Core/Structures');

class DatabaseMessageCreateEvent extends Event {
  constructor(client) {
    super(client, 'messageCreate', 1);
  }

  async execute(msg) {
    await msg.author.data.updateUser();
    if (msg.guild) {
      await msg.guild.data.create();
      await this.client.Helpers.Message.insertMessage(msg);
    }
  }
}

module.exports = DatabaseMessageCreateEvent;