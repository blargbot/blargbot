const { ImageCommand } = require('../../../Core/Structures/Command');
const superagent = require('superagent');

class DeleteCommand extends ImageCommand {
  constructor(client) {
    super(client, {
      name: 'shit',
      info: 'Tells everyone what you think is shit.',
      usage: '[text]',
      flags: [
        { flag: 'p', name: 'plural', info: 'Specifies whether the given text should be plural.' }
      ]
    });
  }

  async execute(ctx) {
    await this.client.Helpers.Image.generate(ctx.channel, 'shit', {
      text: ctx.input._.raw.join(''),
      plural: ctx.input.p !== undefined
    });
  }
}

module.exports = DeleteCommand;