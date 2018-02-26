const BaseHelper = require('./BaseHelper');

class EventHelper extends BaseHelper {
  constructor(client) {
    super(client);
  }

  async create({ guild, start = Date.now(), end, data, type }) {
    await this.client.models.Event.create({
      guild, start, expiry: end, data, type
    });
  }
}

module.exports = EventHelper;