const Manager = require('./Manager');
const Event = require('../Structures/Event');

class EventManager extends Manager {
    constructor() {
        super('Events', Event);
        this.eventList = {};
    }

    load(name) {
        super.load(name);
    }

    unload(name) {
        _discord.removeListener(this.builtList[name].name, this.builtList[name].execute);
        super.unload(name);
    }

    reload(name) {
        _discord.removeListener(this.builtList[name].name, this.builtList[name].execute);
        super.reload(name);
    }

    build(name) {
        if (super.build(name)) {
            _discord.on(this.builtList[name].name, this.builtList[name].execute.bind(this.builtList[name]));
        }
    }
}

module.exports = EventManager;