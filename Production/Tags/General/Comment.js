const { General } = require.main.require('./Tag/Classes');

class CommentTag extends General {
  constructor(client) {
    super(client, {
      name: '//',
      args: [
        {
          name: 'text',
          optional: true,
          repeat: true
        }
      ]
    });
  }
  get base() {
    return `tag.${this.category}.comment`;
  }

  async execute(ctx, args) {
    // no-op
  }
}

module.exports = CommentTag;