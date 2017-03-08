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

class MessageCreateEvent extends Event {
    constructor() {
        super('MessageCreate', 'messageCreate');
    }

    async execute(msg) {
        let prefix = false;
        for (const pref of prefixes) {
            if (msg.content.startsWith(pref)) {
                prefix = pref;
                break;
            }
        }
        if (prefix !== false) {
            const ctx = new Context(msg, msg.content.substring(prefix.length));
            this.handleCommand(ctx);
        }
    }

    async handleCommand(ctx) {
        let commandName = ctx.words[0].toLowerCase();
        if (_discord.CommandManager.has(commandName))
            _discord.CommandManager.execute(commandName, ctx);
    }
}

module.exports = MessageCreateEvent;