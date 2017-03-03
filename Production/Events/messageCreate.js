const { Event } = _core.Structures;

class MessageCreateEvent extends Event {
    constructor() {
        super('messageCreate');
    }

    async execute(msg) {
        console.log(msg.content);
    }
}

module.exports = MessageCreateEvent;