const Manager = require('./Manager');
const Event = require('../Structures/Event');

class EventManager extends Manager {
    constructor() {
        super('Events', Event);
        this.eventList = {};
        this.events = {};
    }

    load(name) {
        super.load(name);
    }

    unload(name) {
        let eventName = this.builtList[name].eventName;
        delete this.eventList[eventName][name];
        delete this.builtList[name];
        super.unload(name);
    }

    reload(name) {
        super.reload(name);
    }

    build(name) {
        if (super.build(name)) {
            let eventName = this.builtList[name].eventName;
            if (!this.eventList[eventName]) this.eventList[eventName] = {};
            this.eventList[eventName][name] = this.builtList[name];
            if (!this.events.hasOwnProperty(eventName)) {
                this.events[eventName] = async function (...args) {
                    for (const event of Object.keys(this.eventList[eventName]).map(k => this.eventList[eventName][k])) {
                        let res = await event.execute(...args);
                        if (res === false) break;
                    }
                }.bind(this);
                _discord.on(eventName, this.events[eventName]);
            }
        }
    }
}

module.exports = EventManager;