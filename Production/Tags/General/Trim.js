const { General } = require.main.require('./Tag/Classes');

class TrimTag extends General {
  constructor(client) {
    super(client, {
      name: 'trim',
      args: [
        {
          name: 'text'
        }
      ],
      minArgs: 1, maxArgs: 1
    });
  }

  async execute(ctx, args) {
    const res = await super.execute(ctx, args);
    args = args.parsedArgs;

    for (let i = 0; i < args.text.length; i++) {
      // If whitespace
      if (typeof args.text[i] === 'string' && args.text[i].trim() === '')
        args.text[i] = '';
      else if (typeof args.text[i] === 'string') {
        args.text[i] = args.text[i].replace(/^\s+/, '');
        break;
      } else break;
    }
    for (let i = args.text.length - 1; i > -1; i--) {
      // If whitespace
      if (typeof args.text[i] === 'string' && args.text[i].trim() === '')
        args.text[i] = '';
      else if (typeof args.text[i] === 'string') {
        args.text[i] = args.text[i].replace(/\s+$/, '');
        break;
      } else break;
    }
    return res.setContent(args.text);
  }
}

module.exports = TrimTag;