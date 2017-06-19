const { Event } = require('../../Core/Structures');

class ReadyEvent extends Event {
    constructor(client) {
        super(client, 'ready');
    }

    async execute() {
        console.init('Ready!');
        //this.client.guilds.forEach(g => g.data.create());
    }
}

module.exports = ReadyEvent;