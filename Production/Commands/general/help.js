const { GeneralCommand } = require('../../../Core/Structures/Command');

class HelpCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'help',
            keys: {
                allCommands: { key: '.allcommands', value: 'Here are all the commands you can execute on **{{guild}}**.\n```markdown\n{{commands}}\n```\nFor more information about commands, do `help <commandname>` or visit <https://blargbot.xyz/commands>.' },
                noCommand: { key: '.nocommand', value: `Sorry, there's no command with the name '{{name}}'!` },
                commandInfo: { key: '.commandinfo', value: '**Command: {{name}}**\n\n**Aliases**: {{aliases}}\n**Usage**: {{usage}}\n\n{{description}}' }
            }
        });
    }

    sortNames(a, b) {
        return a > b;
    }

    async execute(ctx) {
        if (ctx.input._.length === 0) {
            const commands = ctx.client.CommandManager.commandList;
            let sortedCommands = { general: [], image: [], nsfw: [], cat: [] };
            for (const key in commands) {
                let command = commands[key];
                if (await command.canExecute(ctx)) {
                    if (!sortedCommands[command.category])
                        sortedCommands[command.category] = [];
                    sortedCommands[command.category].push(key);
                }
            }
            let output = '';
            for (const key in sortedCommands) {
                if (sortedCommands[key].length === 0) continue;
                output += `### ${key.toUpperCase()}\n`;
                output += sortedCommands[key].sort(this.sortNames).join(', ') + '\n';
            }
            return await ctx.decodeAndSend(this.keys.allCommands, { guild: ctx.guild.name, commands: output });
        } else {
            let name = ctx.input._.raw.join('');
            const command = ctx.client.CommandManager.builtList[name.toLowerCase()];
            if (command) {
                name = command.name;
                let aliases = `[ ${command.aliases.join(' | ')} ]`;
                let usage = await command.getUsage(ctx);
                let description = await command.getInfo(ctx);
                return await ctx.decodeAndSend(this.keys.commandInfo, { name, aliases, usage, description });
            } else {
                return await ctx.decodeAndSend(this.keys.noCommand, { name });
            }
        }
    }
}

module.exports = HelpCommand;