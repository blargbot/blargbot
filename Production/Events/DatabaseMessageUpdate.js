const { Event } = require('../../Core/Structures');

class DatabaseMessageUpdateEvent extends Event {
  constructor(client) {
    super(client, 'messageUpdate', 1);
  }

  async execute(msg, oldMsg) {
    if (oldMsg == null) {
      msg = await this.client.getMessage(msg.channel.id, msg.id);
      let tempOldMsg = await this.client.Helpers.Message.getLatestCachedMessage(msg.id);
    }
    await this.client.Helpers.Message.insertMessage(msg, 'update');
  }
}

module.exports = DatabaseMessageUpdateEvent;