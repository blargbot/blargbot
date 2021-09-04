import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandParameter, ICommand } from '@cluster/types';
import { codeBlock, CommandType, guard, humanize } from '@cluster/utils';
import { SendPayload } from '@core/types';
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

        const allNames = new Set<string>();
        const groupedCommands: Record<string, string[] | undefined> = {};
        for await (const command of context.cluster.commands.list(context.channel, context.author)) {
            const name = [command.name, ...command.aliases].find(n => allNames.size < allNames.add(n).size);
            if (name === undefined)
                continue;

            for await (const category of this.getCategories(context, command))
                (groupedCommands[category] ??= []).push(name);
        }

        const groups = Object.entries(groupedCommands).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
        for (const [name, commands] of groups) {
            fields.push({
                name: `${name} commands`,
                value: codeBlock(commands?.sort().join(', '))
            });
        }

        fields.push({
            name: '\u200B',
            value: `For more information about commands, do \`${context.prefix}help <commandname>\` or visit <${context.util.websiteLink('/commands')}>.\n` +
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

    public async viewCommand(context: CommandContext, commandName: string, page: number, subcommand = ''): Promise<SendPayload> {
        const result = await context.cluster.commands.get(commandName, context.channel, context.author);
        switch (result.state) {
            case 'ALLOWED': break;
            case 'BLACKLISTED':
            case 'DISABLED':
            case 'NOT_FOUND':
            case 'NOT_IN_GUILD':
                return this.error(`The command \`${commandName}\` could not be found`);
            case 'MISSING_PERMISSIONS':
            case 'MISSING_ROLE':
                return this.error(`You dont have permission to run the \`${commandName}\` command`);
        }

        let name = result.detail.name;
        if (name.toLowerCase() !== commandName.toLowerCase()) {
            const byName = await context.cluster.commands.get(result.detail.name, context.channel, context.author);
            if (byName.state !== 'ALLOWED' || byName.detail.implementation !== result.detail.implementation)
                name = commandName;
        }

        if (page < 0)
            return this.error('Page the page number must be 1 or higher');

        const fields: EmbedFieldData[] = [];
        const { detail: command } = result;

        const aliases = [...command.aliases].filter(a => a !== name);

        if (aliases.length > 0)
            fields.push({ name: '**Aliases**', value: aliases.join(', ') });

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

        if (allSignatures.length > 0 && signatures.length === 0) {
            if (filteredSignatures.length === 0)
                return this.error(`No subcommands for \`${name}\` matching \`${subcommand}\` were found`);
            if (page !== 0)
                return this.error(`Page ${page + 1} is empty for \`${name}\`!`);
        }

        for (const signature of signatures) {
            fields.push({
                name: `ℹ️  ${context.prefix}${name}${signature.usage !== '' ? ` ${signature.usage}` : ''}`,
                value: `${signature.notes.map(n => `> ${n}`).join('\n')}\n\n${signature.description}`.trim()
            });
        }

        if (filteredSignatures.length > signatures.length) {
            fields.push({
                name: `... and ${filteredSignatures.length - signatures.length} more`,
                value: `Use \`${context.prefix}help ${name}${subcommand.length === 0 ? '' : ` ${subcommand}`} ${page + 2}\` for more`
            });
        }

        return {
            embeds: [
                {
                    title: `Help for ${name} ${subcommand}`,
                    url: context.util.websiteLink(`/commands#${command.name}`),
                    description: command.description,
                    color: getColor(command.category),
                    fields: fields
                }
            ],
            isHelp: true
        };
    }

    private async * getCategories(context: CommandContext, command: ICommand): AsyncGenerator<string> {
        if (command.roles.length === 0)
            yield command.category;

        if (guard.isGuildCommandContext(context)) {
            for (const roleStr of command.roles) {
                const role = await context.util.getRole(context.channel.guild, roleStr)
                    ?? context.channel.guild.roles.cache.find(r => r.name.toLowerCase() === roleStr.toLowerCase());

                if (role !== undefined)
                    yield role.name;
            }
        }
    }
}

function getColor(type: string): number {
    switch (type.toLowerCase()) {
        case 'custom': return 0x7289da;
        case 'general': return 0xefff00;
        case 'nsfw': return 0x010101;
        case 'image': return 0xefff00;
        case 'admin': return 0xff0000;
        case 'social': return 0xefff00;
        case 'owner': return 0xff0000;
        case 'developer': return 0xff0000;
        case 'staff': return 0xff0000;
        case 'support': return 0xff0000;
        default: return 0;
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
                return `<${parameter.name}>`;
            return `[${parameter.name}]`;
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
            if (parameter.type.descriptionSingular !== undefined)
                result.push(` should be ${parameter.type.descriptionSingular}`);
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
            if (parameter.type.descriptionPlural !== undefined)
                result.push(parameter.type.descriptionPlural);
            if (result.length > 0)
                yield `\`${parameter.name}\` are ${result.join(' ')}`;
            break;

        }

    }
}
