import { ClusterUtilities } from '@blargbot/cluster';
import { CommandParameter, ICommand, ICommandManager } from '@blargbot/cluster/types';
import { codeBlock, guard, humanize } from '@blargbot/cluster/utils';
import { SendPayload } from '@blargbot/core/types';
import { EmbedField, KnownChannel, KnownTextableChannel, User } from 'eris';

export class HelpManager {
    public constructor(
        private readonly commands: ICommandManager,
        private readonly util: ClusterUtilities
    ) {
    }

    public async listCommands(channel: KnownTextableChannel, author: User, prefix: string): Promise<SendPayload> {
        const fields: EmbedField[] = [];

        const allNames = new Set<string>();
        const groupedCommands: Record<string, string[] | undefined> = {};
        for await (const command of this.commands.list(channel, author)) {
            if (command.hidden)
                continue;

            const name = [command.name, ...command.aliases].find(n => allNames.size < allNames.add(n).size);
            if (name === undefined)
                continue;

            for await (const category of this.getCategories(channel, command))
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
            value: `For more information about commands, do \`${prefix}help <commandname>\` or visit <${this.util.websiteLink('/commands')}>.\n` +
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

    public async viewCommand(channel: KnownTextableChannel, author: User, prefix: string, commandName: string, page: number): Promise<SendPayload> {
        const result = await this.commands.get(commandName, channel, author);
        switch (result.state) {
            case 'ALLOWED': break;
            case 'BLACKLISTED':
            case 'DISABLED':
            case 'NOT_FOUND':
            case 'NOT_IN_GUILD':
                return `❌ The command \`${commandName}\` could not be found`;
            case 'MISSING_PERMISSIONS':
            case 'MISSING_ROLE':
                return `❌ You dont have permission to run the \`${commandName}\` command`;
        }

        let name = result.detail.name;
        if (name.toLowerCase() !== commandName.toLowerCase()) {
            const byName = await this.commands.get(result.detail.name, channel, author);
            if (byName.state !== 'ALLOWED' || byName.detail.implementation !== result.detail.implementation)
                name = commandName;
        }

        if (page < 0)
            return '❌ Page the page number must be 1 or higher';

        const fields: EmbedField[] = [];
        const { detail: command } = result;

        const aliases = [...command.aliases].filter(a => a !== name);

        if (aliases.length > 0)
            fields.push({ name: '**Aliases**', value: aliases.join(', ') });

        if (command.flags.length > 0)
            fields.push({ name: '**Flags**', value: humanize.flags(command.flags).join('\n') });

        const allSignatures = command.signatures
            .filter(c => !c.hidden)
            .map(signature => ({
                usage: humanize.commandParameters(signature.parameters),
                description: signature.description,
                notes: signature.parameters.flatMap(p => [...getParameterNotes(p)])
            }));

        const signatures = allSignatures.slice(page * 10).slice(0, 10);
        if (allSignatures.length > 0 && signatures.length === 0) {
            if (page !== 0)
                return `❌ Page ${page + 1} is empty for \`${name}\`!`;
        }

        for (const signature of signatures) {
            fields.push({
                name: `ℹ️  ${prefix}${name}${signature.usage !== '' ? ` ${signature.usage}` : ''}`,
                value: `${signature.notes.map(n => `> ${n}`).join('\n')}\n\n${signature.description}`.trim()
            });
        }

        if (allSignatures.length > signatures.length) {
            fields.push({
                name: `... and ${allSignatures.length - signatures.length} more`,
                value: `Use \`${prefix}help ${name} ${page + 2}\` for more`
            });
        }

        return {
            embeds: [
                {
                    title: `Help for ${name}`,
                    url: this.util.websiteLink(`/commands#${command.name}`),
                    description: command.description,
                    color: getColor(command.category),
                    fields: fields
                }
            ],
            isHelp: true
        };
    }

    private async *getCategories(channel: KnownChannel, command: ICommand): AsyncGenerator<string> {
        if (command.roles.length === 0)
            yield command.category;

        if (guard.isGuildChannel(channel)) {
            for (const roleStr of command.roles) {
                const role = await this.util.getRole(channel.guild, roleStr)
                    ?? channel.guild.roles.find(r => r.name.toLowerCase() === roleStr.toLowerCase());

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
