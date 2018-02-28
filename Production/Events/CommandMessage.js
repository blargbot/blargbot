const { Event, Context } = require('../../Core/Structures');
const { TagContext } = require('../../Core/Tag');

class CommandMessageEvent extends Event {
  constructor(client) {
    super(client, 'messageCreate');
  }

  get prefixes() {
    return [
      this.client.user.username,
      _config.discord.defaultPrefix,
      `<@${this.client.user.id}>`,
      `<@!${this.client.user.id}>`
    ];
  }

  async execute(msg) {
    let prefix = false;
    let shouldBreak = false;
    let prefixes = [].concat(this.prefixes, msg.guild ? (await msg.guild.data.getPrefixes()).reverse() : [],
      (await msg.author.data.getPrefixes()).reverse()).filter(p => !!p);
    for (const pref of prefixes) {
      if (msg.content.startsWith(pref)) {
        prefix = pref;
        break;
      }
    }
    if (prefix !== false) {
      const ctx = new Context(this.client, msg, msg.content.substring(prefix.length).trim(), prefix);
      shouldBreak = await this.handleCommand(ctx);
    }
    return shouldBreak;
  }

  async handleCommand(ctx) {
    if (!ctx.words[0]) return;
    let commandName = ctx.words[0].toLowerCase();
    let didCommand = false;

    let data = await this.client.getDataCustomCommand(commandName, ctx.guild.id);
    let ccommand = await data.getObject();
    if (ccommand && !ccommand.get('restricted')) {
      const tagContext = new TagContext(ctx.client, {
        ctx, content: ccommand.get('content'),
        author: ccommand.get('authorId'), name: ccommand.get('commandName'),
        isCustomCommand: true
      }, data);
      await ctx.send((await tagContext.process()).toString());

    } else if (this.client.CommandManager.has(commandName)) {
      console.output(`${ctx.author.fullNameId} has executed command ${commandName}`);
      didCommand = true;
      this.client.CommandManager.execute(commandName, ctx);
    }

    return didCommand;
  }
}

module.exports = CommandMessageEvent;