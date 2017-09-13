const { GeneralCommand } = require('../../../Core/Structures/Command');

class HelpCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'help',
            aliases: ['commands'],
            keys: {
                allCommands: { key: '.allcommands', value: 'Here are all the commands you can execute on **{{guild}}**.\n```markdown\n{{commands}}\n```\nFor more information about commands, do `help <commandname>` or visit <https://blargbot.xyz/commands>.' },
                noCommand: { key: '.nocommand', value: `Sorry, there's no command with the name '{{name}}'!` },
                noSubcommand: { key: '.nosubcommand', value: `Sorry, there's no subcommand for '{{command}}' with the name '{{name}}'!` },
                commandInfo: { key: '.commandinfo', value: '**{{type}}: {{name}}**\n\n**Aliases**: {{aliases}}\n**Usage**: {{usage}}\n\n{{description}}' },
                noAliases: { key: '.aliases', value: 'No aliases' },
                subcommand: { key: '.subcommand', value: 'Subcommand' },
                command: { key: '.command', value: 'Command' },
                subcommands: { key: '.subcommands', value: '**Subcommands**: {{subcommands}}\n\nDo `help <command> <subcommand>` to get more information about a subcommand!' }
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
        } else if (ctx.input._.length === 1) {
            let name = ctx.input._[0];
            const command = ctx.client.CommandManager.builtList[name.toLowerCase()];
            if (command) {
                name = command.name;
                let aliases;
                if (command.aliases.length > 0)
                    aliases = `[ ${command.aliases.join(' | ')} ]`;
                else aliases = await ctx.decode(this.keys.noAliases);
                let usage = await command.getUsage(ctx);
                let description = await command.getInfo(ctx);
                let parts = [];
                parts.push(await ctx.decode(this.keys.commandInfo,
                    { type: await ctx.decode(this.keys.command), name, aliases, usage, description }));

                if (command.subcommands) {
                    parts.push(await ctx.decode(this.keys.subcommands, { subcommands: `[ ${Object.keys(command.subcommands).join(' | ')} ]` }));
                }

                return parts.join(`\n\n`);
            } else {
                return await ctx.decodeAndSend(this.keys.noCommand, { name });
            }
        } else {
            let name = ctx.input._[0];
            const command = ctx.client.CommandManager.builtList[name.toLowerCase()];
            if (command) {
                let subname = ctx.input._[1].toLowerCase();
                if (command.subcommands && command.subcommands[subname]) {
                    let aliases;
                    let cname = `${name} ${subname}`;
                    if (command.subcommands[subname].aliases && command.subcommands[subname].aliases.length > 0)
                        aliases = `[ ${command.subcommands[subname].aliases.join(' | ')} ]`;
                    else aliases = await ctx.decode(this.keys.noAliases);
                    let usage = `${name} ` + await ctx.decode(`${command.base}.subcommand.${subname}.usage`);
                    let description = await ctx.decode(`${command.base}.subcommand.${subname}.info`);
                    return await ctx.decodeAndSend(this.keys.commandInfo,
                        { type: await ctx.decode(this.keys.subcommand), name: cname, aliases, usage, description });
                } else {
                    return await ctx.decodeAndSend(this.keys.noSubcommand, { command: command.name, name: subname });
                }
            } else {
                return await ctx.decodeAndSend(this.keys.noCommand, { name });
            }
        }
    }
}

module.exports = HelpCommand;