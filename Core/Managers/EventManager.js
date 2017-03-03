const Manager = require('./Manager');
const Event = require('../Structures/Event');

class EventManager extends Manager {
    constructor(client) {
        super('Events', Event, client);
    }

    load(name) {
        super.load(name);
    }

    unload(name) {
        this._client.removeListener(this.builtList[name].name, this.builtList[name].execute);
        super.unload(name);
    }

    reload(name) {
        this._client.removeListener(this.builtList[name].name, this.builtList[name].execute);
        super.reload(name);
    }

    build(name) {
        if (super.build(name)) {
            this._client.on(this.builtList[name].name, this.builtList[name].execute);
        }
    }
}

module.exports = EventManager;