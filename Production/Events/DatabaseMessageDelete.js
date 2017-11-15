const { Event } = require('../../Core/Structures');

class DatabaseMessageDeleteEvent extends Event {
  constructor(client) {
    super(client, 'messageDelete', 1);
  }

  async execute(msg) {
    await this.client.Helpers.Message.insertMessage(msg, 'delete');
  }
}

module.exports = DatabaseMessageDeleteEvent;