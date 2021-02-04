class EventManager {
  constructor() {
    this.cache = {};
  }

  async insert(event) {
    const res = await r.table('events').insert(event, {
      returnChanges: true
    });

    const val = res.changes[0].new_val;
    if (Date.now() - +val.endtime <= 1000 * 60 * 5) {
      this.cache[val.id] = val;
    }
  }

  async process() {
    const events = Object.values(this.cache).filter(e => +e.endtime <= Date.now());

    for (const event of events) {
      if ((event.channel && !bot.getChannel(event.channel))
        || (event.guild && !bot.guilds.get(event.guild))
        || (event.guild && !bot.guilds.get(event.guild))
        || (!event.channel && !event.guild && event.user && process.env.CLUSTER_ID != 0)
        || (event.type === 'purgelogs' && process.env.CLUSTER_ID != 0)) {
        delete this.cache[event.id];
        continue;
      }

      let type = event.type;
      CommandManager.built[type].event(event);
      await this.delete(event.id);
    }
  }

  async delete(id) {
    delete this.cache[id];
    await r.table('events').get(id).delete();
  }

  async deleteFilter(filter) {
    const res = await r.table('events').filter(filter).delete({
      returnChanges: true
    }).run();

    for (const change of res.changes) {
      delete this.cache[change.old_val.id];
    }
  }

  async obtain() {
    let events = await r.table('events').between(r.epochTime(0), r.epochTime(Date.now() / 1000 + 60 * 5), {
      index: 'endtime'
    });

    for (const event of events) {
      this.cache[event.id] = event;
    }
  }
}

bu.events = new EventManager();