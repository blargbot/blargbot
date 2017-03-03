const { Event } = _core.Structures;

class ReadyEvent extends Event {
    constructor() {
        super('ready');
    }

    async execute() {
        console.log('Ready!');
    }
}

module.exports = ReadyEvent;