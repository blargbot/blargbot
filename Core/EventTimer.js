const Sender = require('../Core/Structures/Sender');
const path = require('path');
global._config = require('../config.json');

const Database = require('./Database');

const Logger = require('../Core/Logger');
new Logger(process.env.SHARD_ID, _config.log.level || 'info').setGlobal();
process.on('unhandledRejection', (err, p) => {
  console.error('Unhandled Promise Rejection:', err.stack);
});
const Sequelize = require('sequelize');

class EventTimer extends Sender {
  constructor(interval = 5000) {
    super();
    this.interval = interval;
    this.database = new Database(this);
    this.database.authenticate().then(() => {
    });
  }

  start() {
    setInterval(this.action.bind(this), this.interval);
    this.send('threadReady', process.env.SHARD_ID);
  }

  getData() {
    return { getOrCreateObject() { } };
  }

  async action() {
    // Retrieve all the expired events
    let events = await this.models.Event.findAll({
      where: { expiry: { [Sequelize.Op.lte]: Date.now() } }
    });
    if (events.length > 0) {
      // Iterate events for processing
      for (const event of events) {
        try {
          let expanded = {
            guild: await event.get('guild'),
            start: await event.get('start'),
            expiry: await event.get('expiry'),
            data: await event.get('data')
          };
          // Emit different events depending if it's guild-specific
          if (expanded.guild) {
            this.send('eventGuild', expanded);
          } else {
            this.send('eventGeneric', expanded);
          }

          // Destroy the processed event
          await event.destroy({
            where: {
              id: await event.get('id')
            }
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
}

module.exports = EventTimer;

const eventTimer = new EventTimer();
eventTimer.start();

process.on('message', async msg => {
  const { data, code } = JSON.parse(msg);
  if (code.startsWith('await:')) {
    eventTimer.emit(code, data);
    return;
  }
  switch (code) {
    case 'await':
      const eventKey = 'await:' + data.key;
      switch (data.message) {

      }
      break;
    default:
      break;
  }
});