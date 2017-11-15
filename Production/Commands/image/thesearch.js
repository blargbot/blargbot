const { ImageCommand } = require('../../../Core/Structures/Command');
const superagent = require('superagent');

class TheSearchCommand extends ImageCommand {
  constructor(client) {
    super(client, {
      name: 'thesearch',
      keys: {
        defaultText: '.defaulttext'
      }
    });
  }

  async execute(ctx) {
    let msg = '';
    if (ctx.input._.length > 0)
      msg = ctx.input._.raw.join('');
    else msg = await ctx.decode(this.keys.defaultText);
    await this.client.Helpers.Image.generate(ctx.channel, 'thesearch', {
      text: msg
    });
  }
}

module.exports = TheSearchCommand;