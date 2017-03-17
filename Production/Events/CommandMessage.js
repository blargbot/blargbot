const { Event, Context } = _discord.Core.Structures;

const prefixes = ['blargbot'];
if (_config.general.isbeta) {
    prefixes.push('k!');
    prefixes.push('<@198554059295293440>');
    prefixes.push('<@!198554059295293440>');
} else {
    prefixes.push('b!');
    prefixes.push('<@134133271750639616>');
    prefixes.push('<@!134133271750639616>');
}

class CommandMessageEvent extends Event {
    constructor() {
        super('messageCreate');
    }

    async execute(msg) {
        let prefix = false;
        let shouldBreak = false;
        for (const pref of prefixes) {
            if (msg.content.startsWith(pref)) {
                prefix = pref;
                break;
            }
        }
        if (prefix !== false) {
            const ctx = new Context(msg, msg.content.substring(prefix.length));
            shouldBreak = await this.handleCommand(ctx);
        }
        return shouldBreak;
    }

    async handleCommand(ctx) {
        let commandName = ctx.words[0].toLowerCase();
        let didCommand = false;
        if (_discord.CommandManager.has(commandName)) {
            didCommand = true;
            _discord.CommandManager.execute(commandName, ctx);
        }

        return didCommand;
    }
}

module.exports = CommandMessageEvent;