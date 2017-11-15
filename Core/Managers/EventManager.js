const Manager = require('./Manager');
const Event = require('../Structures/Event');

class EventManager extends Manager {
  constructor(client) {
    super(client, 'Events', Event);
    this.eventList = {};
    this.events = {};
  }

  unload(...names) {
    let name = names[names.length - 1];

    let eventName = this.builtList[name].eventName;
    delete this.eventList[eventName][name];
    super.unload(name);
  }

  build(...names) {
    let name = names[names.length - 1];
    if (super.build(name)) {
      let eventName = this.builtList[name].eventName;
      if (!this.eventList[eventName]) this.eventList[eventName] = {};
      this.eventList[eventName][name] = this.builtList[name];
      if (!this.events.hasOwnProperty(eventName)) {
        this.events[eventName] = async function (...args) {
          if (!this.client.ready) return;
          for (const event of Object.keys(this.eventList[eventName])
            .map(k => this.eventList[eventName][k])
            .sort((a, b) => a.priority - b.priority)) {
            try {
              let res = await event.execute(...args);
              if (res === true) break;
            } catch (err) {
              console.error(err);
            }
          }
        }.bind(this);
        this.client.on(eventName, this.events[eventName]);
      }
    }
  }
}

module.exports = EventManager;