const { Event, Context } = require('../../Core/Structures');

class CommandMessageEvent extends Event {
    constructor(client) {
        super(client, 'messageCreate');

        this.prefixes = [
            'blargbot',
            _config.discord.defaultPrefix,
            `<@${client.user.id}>`,
            `<@!${client.user.id}>`
        ];
    }

    async execute(msg) {
        let prefix = false;
        let shouldBreak = false;
        for (const pref of this.prefixes) {
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