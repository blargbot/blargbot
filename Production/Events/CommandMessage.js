const { Event, Context } = require('../../Core/Structures');

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
        let prefixes = [].concat(this.prefixes, (await msg.guild.data.getPrefixes()).reverse(),
            (await msg.author.data.getPrefixes()).reverse()).filter(p => !!p);
        console.log(prefixes);
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
        if (this.client.CommandManager.has(commandName)) {
            console.output(`${ctx.author.fullNameId} has executed command ${commandName}`);
            didCommand = true;
            this.client.CommandManager.execute(commandName, ctx);
        }

        return didCommand;
    }
}

module.exports = CommandMessageEvent;