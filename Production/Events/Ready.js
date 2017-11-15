const { Event } = require('../../Core/Structures');

class ReadyEvent extends Event {
  constructor(client) {
    super(client, 'ready');
  }

  async execute() {
    console.info('Ready! Guilds:', this.client.guilds.size);
    this.client.sender.send('ready', this.client.guilds.map(g => g.id));
    //this.client.guilds.forEach(g => g.data.create());
  }
}

module.exports = ReadyEvent;