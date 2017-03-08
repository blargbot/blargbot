class Event {

    constructor(name, eventName) {
        if (this.constructor === Event) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.name = name || this.constructor.name;
        this.eventName = eventName || this.constructor.name;
    }

    async execute() {
        // NO-OP
    }

}

module.exports = Event;