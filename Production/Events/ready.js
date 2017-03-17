const { Event } = _discord.Core.Structures;

class ReadyEvent extends Event {
    constructor() {
        super('ready');
    }

    async execute() {
        _logger.init('Ready!');
    }
}

module.exports = ReadyEvent;