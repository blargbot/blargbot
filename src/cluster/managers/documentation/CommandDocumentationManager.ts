import { codeBlock, guard } from '@blargbot/core/utils';
import { AdvancedMessageContent, EmbedField, KnownChannel, KnownTextableChannel, User } from 'eris';

import { Cluster } from '../../Cluster';
import { CommandGetResult, CommandParameter, ICommand } from '../../types';
import { humanize } from '../../utils';
import { Documentation, DocumentationGroup, DocumentationPage } from './DocumentationManager';
import { DocumentationTreeManager } from './DocumentationTreeManager';

export class CommandDocumentationManager extends DocumentationTreeManager {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super(cluster, 'cmd', 'help');
        this.#cluster = cluster;
    }

    protected async getTree(user: User, channel: KnownTextableChannel): Promise<Documentation> {
        const guild = guard.isGuildChannel(channel) ? channel.guild : undefined;
        const groups = new Map<string, DocumentationGroup & { items: Mutable<DocumentationGroup['items']>; }>();
        const categoryMap = new Map<string, string[]>();
        for await (const item of this.#cluster.commands.list(guild, user)) {
            if (item.state === 'NOT_FOUND')
                continue;

            const command = item.detail.command;
            const docs = this.#getCommandDocs(item);
            const categories: string[] = [];
            categoryMap.set(command.name, categories);

            for await (const category of this.#getCategories(channel, command)) {
                categories.push(category.name);
                let group = groups.get(category.id);
                if (group === undefined) {
                    groups.set(category.id, group = {
                        id: category.id,
                        name: category.name,
                        type: 'group',
                        items: [],
                        embed: {
                            color: docs.embed.color
                        },
                        selectText: 'Pick a command'
                    });
                }

                group.items.push({
                    ...docs,
                    id: `${category.id}_${docs.id}`
                });
            }
        }

        const sortedGroups = [...groups.values()]
            .map(g => ({
                ...g,
                items: [...g.items].sort((a, b) => a.name < b.name ? -1 : 1),
                hidden: g.items.every(i => i.hidden === true),
                embed: {
                    ...g.embed,
                    fields: [
                        {
                            name: `${g.name} commands`,
                            value: codeBlock(g.items.filter(i => i.hidden !== true).map(i => i.name).join(', '))
                        }
                    ]
                }
            }))
            .sort((a, b) => a.name < b.name ? -1 : 1);

        return {
            id: 'index',
            name: 'Help',
            tags: [''],
            type: 'group',
            embed: {
                fields: sortedGroups.filter(g => g.hidden !== true).map(g => ({
                    name: `${g.name} commands`,
                    value: codeBlock(g.items.filter(i => i.hidden !== true).map(i => i.name).join(', '))
                }))
            },
            selectText: 'Pick a command group',
            items: sortedGroups
        };
    }

    protected noMatches(): Awaitable<Omit<AdvancedMessageContent, 'components'>> {
        return {
            content: '❌ Oops, I couldnt find that command! Try using `b!help` for a list of all commands',
            embeds: []
        };
    }

    #getCommandDocs(result: Exclude<CommandGetResult, { state: 'NOT_FOUND'; }>): Documentation {
        const description = [];
        switch (result.state) {
            case 'ALLOWED':
                break;
            case 'BLACKLISTED':
            case 'DISABLED':
            case 'NOT_IN_GUILD':
            case 'MISSING_PERMISSIONS':
            case 'MISSING_ROLE':
                description.push(codeBlock(`❌ You cannot use b!${result.detail.command.name}`));
                break;
        }
        const { detail: { command } } = result;
        const fields: EmbedField[] = [];
        if (command.description !== undefined && command.description.length > 0)
            description.push(command.description);

        if (command.aliases.length > 0)
            fields.push({ name: '**Aliases**', value: command.aliases.join(', ') });

        if (command.flags.length > 0)
            fields.push({ name: '**Flags**', value: humanize.flags(command.flags).join('\n') });

        const signatures = command.signatures
            .filter(c => !c.hidden)
            .map(signature => ({
                usage: humanize.commandParameters(signature.parameters),
                description: signature.description,
                notes: signature.parameters.flatMap(p => [...this.#getParameterNotes(p)])
            }));

        const pages: DocumentationPage[] = [];
        for (const signature of signatures) {
            const usage = `b!${command.name}${signature.usage !== '' ? ` ${signature.usage}` : ''}`;
            pages.push({
                name: usage,
                embed: {
                    fields: [{
                        name: `ℹ️  ${usage}`,
                        value: `${signature.notes.map(n => `> ${n}`).join('\n')}\n\n${signature.description}`.trim()
                    }]
                }
            });
        }

        return {
            id: command.id,
            name: command.name,
            type: 'paged',
            hidden: result.state !== 'ALLOWED',
            embed: {
                url: `/commands#${command.name}`,
                description: description.join('\n'),
                color: this.#getColor(command.category)
            },
            selectText: 'Pick a command signature',
            pages: pages.sort((a, b) => a.name < b.name ? -1 : 1)
        };
    }

    #getColor(type: string): number {
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

    *#getParameterNotes(parameter: CommandParameter): Generator<string> {
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

    async *#getCategories(channel: KnownChannel, command: ICommand): AsyncGenerator<{ name: string; id: string; }> {
        if (command.roles.length === 0)
            yield { name: command.category, id: command.category };

        if (guard.isGuildChannel(channel)) {
            for (const roleStr of command.roles) {
                const role = await this.#cluster.util.getRole(channel.guild, roleStr)
                    ?? channel.guild.roles.find(r => r.name.toLowerCase() === roleStr.toLowerCase());

                if (role !== undefined)
                    yield { name: role.name, id: role.id };
            }
        }
    }
}
