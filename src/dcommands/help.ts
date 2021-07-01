import { EmbedField, GuildChannel } from 'eris';
import { Cluster } from '../cluster';
import { SendPayload } from '../core/BaseUtilities';
import { BaseCommand, BaseGlobalCommand, CommandContext } from '../core/command';
import { StoredGuildCommand } from '../core/database';
import { codeBlock, CommandType, commandTypes, guard, humanize } from '../utils';

export class HelpCommand extends BaseGlobalCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'help',
            category: CommandType.GENERAL,
            definition: {
                description: 'Shows a list of all the available commands',
                execute: (ctx) => this.listCommands(ctx),
                subcommands: {
                    '{commandName} {subcommand?}': {
                        description: 'Shows the help text for the given command',
                        execute: (msg, [commandName, subcommand]) => this.viewCommand(msg, commandName, subcommand)
                    }
                }
            }
        });
    }

    public async listCommands(context: CommandContext): Promise<SendPayload> {
        const fields: EmbedField[] = [];

        let getCommandGroups = (command: BaseCommand): Promise<readonly string[]> =>
            Promise.resolve([commandTypes.properties[command.category].name]);

        let prefix = this.config.discord.defaultPrefix;
        const customCommands = new Map<string, StoredGuildCommand | undefined>();
        if (guard.isGuildCommandContext(context)) {
            for (const command of await this.database.guilds.listCommands(context.channel.guild.id)) {
                if (!await this.util.canExecuteCustomCommand(context, command, true))
                    customCommands.set(command.name, undefined);
                else
                    customCommands.set(command.name, command);
            }
            let prefixes = await this.database.guilds.getSetting(context.channel.guild.id, 'prefix');
            if (typeof prefixes === 'string')
                prefixes = [prefixes];
            if (prefixes !== undefined)
                prefix = prefixes[0];

            getCommandGroups = async (command) => {
                const perms = await this.database.guilds.getCommandPerms(context.channel.guild.id, command.name);
                const roles = perms?.rolename;
                switch (typeof roles) {
                    case 'string': return [roles];
                    case 'undefined': return [commandTypes.properties[command.category].name];
                    default: return roles;
                }
            };
        }

        const commandGroups = new Map<string, Set<string>>();
        for (const command of this.cluster.commands.list()) {
            if (command.checkContext(context) && !await this.util.canExecuteDefaultCommand(context, command, true))
                continue;

            const commandName = command.names.find(n => !customCommands.has(n));
            if (commandName === undefined)
                continue;

            for (const groupName of await getCommandGroups(command)) {
                const group = commandGroups.get(groupName) ?? new Set();
                if (group.size === 0)
                    commandGroups.set(groupName, group);
                group.add(commandName);
            }
        }

        const groups = [...commandGroups.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
        for (const [name, commandNames] of groups) {
            fields.push({
                name: `${name} commands`,
                value: codeBlock([...commandNames].sort().join(', '))
            });
        }
        if (customCommands.size > 0) {
            const commandNames = [...customCommands.entries()].filter(e => e[1] !== undefined).map(e => e[0]);
            fields.push({
                name: 'Custom commands',
                value: codeBlock(commandNames.sort().join(', '))
            });
        }

        fields.push({
            name: '\u200B',
            value: `For more information about commands, do \`${prefix}help <commandname>\` or visit <${this.util.websiteLink('/commands')}>.\n` +
                'Want to support the bot? Consider donating to <https://patreon.com/blargbot> - all donations go directly towards recouping hosting costs.'
        });

        return {
            embed: {
                color: 0x7289da,
                fields: fields
            },
            isHelp: true
        };
    }

    public async viewCommand(context: CommandContext, commandName: string, subcommand?: string): Promise<SendPayload> {

        if (guard.isGuildCommandContext(context)) {
            const command = await this.database.guilds.getCommand(context.channel.guild.id, commandName);
            if (command !== undefined)
                return this.viewCustomCommand(context, commandName, command);
        }

        const command = this.cluster.commands.get(commandName);
        if (command !== undefined)
            return this.viewDefaultCommand(context, command, subcommand);

        return { content: `❌ The command \`${commandName}\` could not be found` };
    }

    public async viewCustomCommand(context: CommandContext<GuildChannel>, commandName: string, command: StoredGuildCommand): Promise<SendPayload> {
        if (!await this.util.canExecuteCustomCommand(context, command, true))
            return { content: `❌ You dont have permission to run the \`${commandName}\` command` };

        return {
            embed: {
                title: `Help for ${commandName} (Custom Command)`,
                description: command.help ?? '_No help text has been supplied_',
                color: 0x7289da
            },
            isHelp: true
        };
    }

    public async viewDefaultCommand(context: CommandContext, command: BaseCommand, subcommand?: string): Promise<SendPayload> {
        if (!await this.util.canExecuteDefaultCommand(context, command, true))
            return { content: `❌ You dont have permission to run the \`${command.name}\` command` };

        const fields: EmbedField[] = [];

        if (command.aliases.length > 0)
            fields.push({ name: '**Aliases**', value: command.aliases.join(', ') });

        if (command.flags.length > 0)
            fields.push({ name: '**Flags**', value: humanize.flags(command.flags).join('\n') });

        return {
            embed: {
                title: `Help for ${command.name} ${subcommand ?? ''}`,
                url: this.util.websiteLink(`/commands#${command.name}`),
                description: 'TODO',
                color: commandTypes.properties[command.category].color,
                fields: fields
            },
            isHelp: true
        };
    }

    // getColor(category) {
    //     switch (category) {
    //         case newbutils.commandTypes.CAT:
    //         case newbutils.commandTypes.ADMIN: return 0xff0000;
    //         case newbutils.commandTypes.NSFW: return 0x010101;
    //         case newbutils.commandTypes.IMAGE:
    //         case newbutils.commandTypes.GENERAL: return 0xefff00;
    //         default: return 0x7289da;
    //     }
    // }

    // async execute(msg, words, text) {
    //     if (words.length > 1) {
    //         let embed = {
    //             fields: [],
    //             get asString() {
    //                 return stringify(this);
    //             }
    //         };
    //         if (CommandManager.commandList.hasOwnProperty(words[1]) && !CommandManager.commandList[words[1]].hidden
    //             && (!CommandManager.commandList[words[1]].onlyOn || CommandManager.commandList[words[1]].onlyOn === msg.guild.id)) {
    //             let instance = CommandManager.built[CommandManager.commandList[words[1]].name];
    //             let definition = CommandManager.commandList[words[1]];
    //             embed.title = `Help for ${definition.name}`;
    //             embed.url = `https://blargbot.xyz/commands#${definition.name}`;
    //             embed.description = `**__Usage__**:\`${definition.usage}\`\n${definition.info}`;
    //             embed.color = this.getColor(instance.category);
    //             if (instance.aliases && instance.aliases.length > 0)
    //                 embed.fields.push({
    //                     name: '**Aliases**',
    //                     value: instance.aliases.join(', ')
    //                 });
    //             if (instance.flags && instance.flags.length > 0)
    //                 embed.fields.push({
    //                     name: '**Flags**',
    //                     value: instance.flags.map(flag => `\`-${flag.flag}\` or \`--${flag.word}\` - ${flag.desc}`).join('\n')
    //                 });
    //         } else {
    //             let helpText = await bu.ccommand.gethelp(msg.guild.id, words[1]);
    //             if (helpText) {
    //                 embed.color = this.getColor('CUSTOM');
    //                 embed.title = `Help for ${words[1].toLowerCase()} (Custom Command)`;
    //                 embed.description = helpText;
    //             }
    //         }
    //         if (!embed.title)
    //             bu.send(msg, `No description could be found for command \`${words[1]}\`.`);
    //         else
    //             bu.send(msg, { embed });
    //     } else {
    //         let embed = {
    //             fields: [],
    //             get asString() {
    //                 return stringify(this);
    //             }
    //         };
    //         embed.color = this.getColor('CUSTOM');
    //         var generalCommands = [];
    //         var otherCommands = {};
    //         var modifiedCommands = [];
    //         let storedGuild, permOverride, staffPerms, adminRole;
    //         if (msg.channel.guild) {
    //             storedGuild = await bu.getGuild(msg.guild.id);
    //             permOverride = await bu.guildSettings.get(msg.channel.guild.id, 'permoverride');
    //             staffPerms = await bu.guildSettings.get(msg.channel.guild.id, 'staffPerms');
    //             adminRole = storedGuild.settings.adminrole;
    //             let customizedCommands = storedGuild.commandperms;
    //             //    console.debug(customizedCommands);
    //             for (let key in customizedCommands) {
    //                 if (!CommandManager.commandList.hasOwnProperty(key)) continue;
    //                 if (customizedCommands[key].rolename != null)
    //                     for (let i = 0; i < customizedCommands[key].rolename.length; i++) {
    //                         if (!otherCommands[customizedCommands[key].rolename[i].toLowerCase()]) {
    //                             console.debug('creating an entry for', customizedCommands[key].rolename[i].toLowerCase());
    //                             otherCommands[customizedCommands[key].rolename[i].toLowerCase()] = [];
    //                         }
    //                         otherCommands[customizedCommands[key].rolename[i].toLowerCase()]
    //                             .push(key);
    //                         modifiedCommands.push(key);
    //                     }
    //             }
    //             console.debug(customizedCommands);
    //         }
    //         //    console.debug(modifiedCommands);
    //         //   console.debug(otherCommands);
    //         for (var command in CommandManager.built) {
    //             if (modifiedCommands.indexOf(command) == -1)
    //                 if (!CommandManager.built[command].hidden && (!CommandManager.built[command].onlyOn || (msg.guild && CommandManager.built[command].onlyOn === msg.guild.id))) {
    //                     if (CommandManager.built[command].category == newbutils.commandTypes.GENERAL) {
    //                         if ((await bu.canExecuteCommand(msg, command, true, { storedGuild, permOverride, staffPerms })).executable)
    //                             generalCommands.push(command);
    //                     } else {
    //                         let category = CommandManager.built[command].category;
    //                         if (!otherCommands[CommandManager.built[command].category])
    //                             otherCommands[CommandManager.built[command].category] = [];
    //                         otherCommands[CommandManager.built[command].category].push(command);
    //                     }
    //                 }
    //         }
    //         generalCommands.sort();
    //         embed.fields.push({
    //             name: 'General Commands',
    //             value: '```\n' + generalCommands.join(', ') + '\n```'
    //         });

    //         var onComplete = async () => {
    //             if (msg.channel.guild) {
    //                 let ccommands = storedGuild.ccommands;
    //                 //      console.debug(ccommands);
    //                 if (ccommands && Object.keys(ccommands).length > 0) {
    //                     var helpCommandList = [];
    //                     for (var key in ccommands) {
    //                         if (await bu.canExecuteCcommand(msg, key, true))
    //                             helpCommandList.push(key);
    //                     }
    //                     helpCommandList.sort();
    //                     embed.fields.push({
    //                         name: 'Custom Commands',
    //                         value: '```\n' + helpCommandList.join(', ') + '\n```'
    //                     });
    //                 }
    //             }

    //             let prefix = '';
    //             let finalText = '';
    //             if (!msg.channel.guild)
    //                 finalText += 'Not all of these commands will work in DM\'s\n';
    //             else {
    //                 let prefixes = await bu.guildSettings.get(msg.channel.guild.id, 'prefix');
    //                 prefix = prefixes ? prefixes[0] : config.discord.defaultPrefix;
    //             }
    //             finalText += 'For more information about commands, do `' + prefix + 'help <commandname>` or visit <https://blargbot.xyz/commands>.\nWant to support the bot? Consider donating to <https://patreon.com/blargbot> - all donations go directly towards recouping hosting costs.';

    //             embed.fields.push({
    //                 name: '\u200B',
    //                 value: finalText
    //             });

    //             await this.sendHelp(msg, { embed }, 'commands');
    //         };

    //         function nextCommand(category, completeCommandList) {
    //             if (!newbutils.commandTypes.properties.hasOwnProperty(category) ||
    //                 newbutils.commandTypes.properties[category].requirement(msg, storedGuild)) {
    //                 if (completeCommandList.length > 0) {
    //                     completeCommandList.sort();
    //                     let categoryString = '';
    //                     if (newbutils.commandTypes.properties.hasOwnProperty(category)) {
    //                         if (category == newbutils.commandTypes.ADMIN && adminRole)
    //                             categoryString = adminRole;
    //                         else categoryString = newbutils.commandTypes.properties[category].name;
    //                     } else categoryString = category;
    //                     embed.fields.push({
    //                         name: `${categoryString.charAt(0).toUpperCase() + categoryString.slice(1)} Commands`,
    //                         value: '```\n' + completeCommandList.join(', ') + '\n```'
    //                     });
    //                 }
    //             }
    //             i++;
    //             completeCommandList.length = 0;
    //             processCategory(i);
    //         }
    //         let completeCommandList = [],
    //             category, counter, i = 0,
    //             ii;

    //         function doThing({ executable, name }) {
    //             if (executable) {
    //                 completeCommandList.push(name);
    //             }
    //             if (--counter == 0) {
    //                 nextCommand(category, completeCommandList);
    //             }
    //         }

    //         function processCategory() {
    //             if (i == Object.keys(otherCommands).length) {
    //                 onComplete();
    //             } else {
    //                 category = Object.keys(otherCommands)[i];
    //                 //    if (!newbutils.commandTypes.properties.hasOwnProperty(category) || newbutils.commandTypes.properties[category].requirement(msg)) {
    //                 //otherCommands[category].sort();
    //                 counter = otherCommands[category].length;
    //                 for (ii = 0; ii < otherCommands[category].length; ii++) {
    //                     bu.canExecuteCommand(msg, otherCommands[category][ii], true, { storedGuild, permOverride, staffPerms }).then(doThing);
    //                 }
    //                 //    }
    //             }
    //         }
    //         processCategory(i);
    //     }
    // }

    // async sendHelp(msg, message, type, isPlural = false) {
    //     if (typeof message != 'object')
    //         message = { content: message };

    //     if (msg.channel.guild && await bu.guildSettings.get(msg.channel.guild.id, 'dmhelp')) {
    //         let dmChannel = await bot.getDMChannel(msg.author.id);
    //         await bu.send(msg, '📧 DMing you the ' + type + ' 📧');
    //         message.content = 'Here ' + (isPlural ? 'are' : 'is') + ' the ' + type + ' you requested in <#' + msg.channel.id + '>\n' + (message.content || '');
    //         await bu.send(dmChannel.id, message);
    //     } else
    //         await bu.send(msg, message);
    // };

}