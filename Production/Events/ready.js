const { Event } = _discord.Core.Structures;

class ReadyEvent extends Event {
    constructor() {
        super('Ready', 'ready');
    }

    async execute() {
        console.log('Ready!');
    }
}

module.exports = ReadyEvent;