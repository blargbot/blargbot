const { Event, Context } = require('../../Core/Structures');

const prefixes = ['blargbot'];
if (_config.beta) {
    prefixes.push('k!');
    prefixes.push('<@198554059295293440>');
    prefixes.push('<@!198554059295293440>');
} else {
    prefixes.push('b!');
    prefixes.push('<@134133271750639616>');
    prefixes.push('<@!134133271750639616>');
}

class CommandMessageEvent extends Event {
    constructor(client) {
        super(client, 'messageCreate');
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
            const ctx = new Context(this.client, msg, msg.content.substring(prefix.length));
            shouldBreak = await this.handleCommand(ctx);
        }
        return shouldBreak;
    }

    async handleCommand(ctx) {
        let commandName = ctx.words[0].toLowerCase();
        let didCommand = false;
        if (this.client.CommandManager.has(commandName)) {
            console.output(`${ctx.author.fullName} has executed command ${commandName}`);
            didCommand = true;
            this.client.CommandManager.execute(commandName, ctx);
        }

        return didCommand;
    }
}

module.exports = CommandMessageEvent;