class Event {
    constructor(client, eventName, priority) {
        this.client = client;
        if (this.constructor === Event) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.name = this.constructor.name;
        this.eventName = eventName || this.constructor.name;
        this.priority = priority || 5;
    }

    async execute() {
        // NO-OP
    }

}

module.exports = Event;