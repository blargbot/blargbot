import { BaseCommand, BaseGlobalCommand, CommandContext, CommandVariableType } from '@cluster/command';
import { CommandParameter, GuildCommandContext } from '@cluster/types';
import { codeBlock, CommandType, commandTypeDetails, guard, humanize } from '@cluster/utils';
import { SendPayload, StoredGuildCommand } from '@core/types';
import { EmbedFieldData } from 'discord.js';

export class HelpCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'help',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Shows a list of all the available commands',
                    execute: (ctx) => this.listCommands(ctx)
                },
                {
                    parameters: '{commandName} {subcommand+?} {page:number=1}',
                    description: 'Shows the help text for the given command',
                    execute: (msg, [commandName, subcommand, page]) => this.viewCommand(msg, commandName, page - 1, subcommand)
                }
            ]
        }, true);
    }

    public async listCommands(context: CommandContext): Promise<SendPayload> {
        const fields: EmbedFieldData[] = [];

        let getCommandGroups = (command: BaseCommand): Promise<readonly string[]> =>
            Promise.resolve([commandTypeDetails[command.category].name]);

        let prefix = context.config.discord.defaultPrefix;
        const customCommands = new Map<string, StoredGuildCommand | undefined>();
        if (guard.isGuildCommandContext(context)) {
            for (const command of await context.database.guilds.listCommands(context.channel.guild.id)) {
                if (!await context.cluster.commands.canExecuteCustomCommand(context, command, { quiet: true }))
                    customCommands.set(command.name, undefined);
                else
                    customCommands.set(command.name, command);
            }
            let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, 'prefix');
            if (typeof prefixes === 'string')
                prefixes = [prefixes];
            if (prefixes !== undefined)
                prefix = prefixes[0];

            getCommandGroups = async (command) => {
                const perms = await context.database.guilds.getCommandPerms(context.channel.guild.id, command.name);
                const roles = perms?.rolename;
                switch (typeof roles) {
                    case 'string': return [roles];
                    case 'undefined': return [commandTypeDetails[command.category].name];
                    default: return roles;
                }
            };
        }

        const commandGroups = new Map<string, Set<string>>();
        for (const command of context.cluster.commands.list()) {
            if (command.checkContext(context) && !await context.cluster.commands.canExecuteDefaultCommand(context, command, { quiet: true }))
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
            value: `For more information about commands, do \`${prefix}help <commandname>\` or visit <${context.util.websiteLink('/commands')}>.\n` +
                'Want to support the bot? Consider donating to <https://patreon.com/blargbot> - all donations go directly towards recouping hosting costs.'
        });

        return {
            embeds: [
                {
                    color: 0x7289da,
                    fields: fields
                }
            ],
            isHelp: true
        };
    }

    public async viewCommand(context: CommandContext, commandName: string, page: number, subcommand: string | undefined): Promise<SendPayload> {
        if (guard.isGuildCommandContext(context)) {
            const command = await context.database.guilds.getCommand(context.channel.guild.id, commandName);
            if (command !== undefined)
                return this.viewCustomCommand(context, commandName, command);
        }

        const command = context.cluster.commands.get(commandName);
        if (command !== undefined)
            return this.viewDefaultCommand(context, command, page, subcommand);

        return this.error(`The command \`${commandName}\` could not be found`);
    }

    public async viewCustomCommand(context: GuildCommandContext, commandName: string, command: StoredGuildCommand): Promise<SendPayload> {
        if (!await context.cluster.commands.canExecuteCustomCommand(context, command, { quiet: true }))
            return this.error(`You dont have permission to run the \`${commandName}\` command`);

        return {
            embeds: [
                {
                    title: `Help for ${commandName} (Custom Command)`,
                    description: command.help ?? '_No help text has been supplied_',
                    color: 0x7289da
                }
            ],
            isHelp: true
        };
    }

    public async viewDefaultCommand(context: CommandContext, command: BaseCommand, page: number, subcommand = ''): Promise<SendPayload> {
        if (!await context.cluster.commands.canExecuteDefaultCommand(context, command, { quiet: true }))
            return this.error(`You dont have permission to run the \`${command.name}\` command`);

        if (page < 0)
            return this.error('Page the page number must be 1 or higher');

        const fields: EmbedFieldData[] = [];

        if (command.aliases.length > 0)
            fields.push({ name: '**Aliases**', value: command.aliases.join(', ') });

        if (command.flags.length > 0)
            fields.push({ name: '**Flags**', value: humanize.flags(command.flags).join('\n') });

        const allSignatures = command.signatures
            .filter(c => !c.hidden)
            .map(signature => ({
                usage: stringifyParameters(signature.parameters),
                description: signature.description,
                notes: signature.parameters.flatMap(p => [...getParameterNotes(p)])
            }));

        const filteredSignatures = subcommand.length > 0
            ? allSignatures.slice(page * 10)
            : allSignatures.filter(s => s.usage.startsWith(subcommand.toLowerCase())).slice(page * 10);

        const signatures = filteredSignatures.slice(0, 10);

        if (signatures.length === 0) {
            if (filteredSignatures.length === 0)
                return this.error(`No subcommands for \`${command.name}\` matching \`${subcommand}\` were found`);
            if (page !== 0)
                return this.error(`Page ${page + 1} is empty for \`${command.name}\`!`);
        }

        for (const signature of signatures) {
            fields.push({
                name: `__\`${context.prefix}${command.name}${signature.usage !== '' ? ` ${signature.usage}` : ''}\`__`,
                value: `${signature.notes.join('\n')}\n\n${signature.description}`.trim()
            });
        }

        if (filteredSignatures.length > signatures.length) {
            fields.push({
                name: `... and ${filteredSignatures.length - signatures.length} more`,
                value: `Use \`${context.prefix}help ${command.name}${subcommand.length === 0 ? '' : ` ${subcommand}`} ${page + 2}\` for more`
            });
        }

        return {
            embeds: [
                {
                    title: `Help for ${command.name} ${subcommand}`,
                    url: context.util.websiteLink(`/commands#${command.name}`),
                    description: command.description ?? undefined,
                    color: commandTypeDetails[command.category].color,
                    fields: fields
                }
            ],
            isHelp: true
        };
    }
}

function stringifyParameters(parameters: readonly CommandParameter[]): string {
    return parameters.map(stringifyParameter).join(' ');
}

function stringifyParameter(parameter: CommandParameter): string {
    switch (parameter.kind) {
        case 'literal': return parameter.name;
        case 'singleVar':
            if (parameter.required)
                return `<${parameter.name}>`;
            return `[${parameter.name}]`;
        case 'concatVar':
            if (parameter.required)
                return `<...${parameter.name}>`;
            return `[...${parameter.name}]`;
        case 'greedyVar':
            if (parameter.minLength === 0)
                return `[...${parameter.name}]`;
            return `<...${parameter.name}>`;
    }
}

function* getParameterNotes(parameter: CommandParameter): Generator<string> {
    switch (parameter.kind) {
        case 'literal':
            if (parameter.alias.length > 0)
                yield `\`${parameter.name}\` can be replaced with ${humanize.smartJoin(parameter.alias.map(a => `\`${a}\``), ', ', ' or ')}`;
            break;
        case 'concatVar':
        case 'singleVar': {
            const result = [];
            if (parameter.type !== 'string')
                result.push(` should be ${typeStrings[parameter.type].single}`);
            if (parameter.fallback !== undefined && parameter.fallback.length > 0)
                result.push(`defaults to \`${parameter.fallback}\``);
            if (result.length > 0)
                yield `\`${parameter.name}\` ${result.join(' and ')}`;
            break;
        }
        case 'greedyVar': {
            const result = [];
            if (parameter.minLength > 1)
                result.push(`${parameter.minLength} or more`);
            if (parameter.type !== 'string')
                result.push(typeStrings[parameter.type].plural);
            if (result.length > 0)
                yield `\`${parameter.name}\` are ${result.join(' ')}`;
            break;

        }

    }
}

const typeStrings: { [key in CommandVariableType]: { single: string; plural: string; } } = {
    get string(): never { throw new Error('AAAAAA'); },
    boolean: { single: 'true/false', plural: 'true/false' },
    channel: { single: 'a channel id, mention or name', plural: 'channel ids, mentions or names' },
    duration: { single: 'a duration', plural: 'durations' },
    integer: { single: 'a whole number', plural: 'whole numbers' },
    member: { single: 'a user id, mention or name', plural: 'user ids, mentions or names' },
    number: { single: 'a number', plural: 'numbers' },
    role: { single: 'a role id, mention or name', plural: 'role ids, mentions or names' },
    user: { single: 'a user id, mention or name', plural: 'user ids, mentions or names' }
};
