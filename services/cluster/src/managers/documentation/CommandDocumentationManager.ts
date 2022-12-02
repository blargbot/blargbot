import { FormatEmbedField, SendContent } from '@blargbot/core/types.js';
import { discord, guard } from '@blargbot/core/utils/index.js';
import { format, IFormattable, util } from '@blargbot/formatting';
import * as Eris from 'eris';

import { Cluster } from '../../Cluster.js';
import templates from '../../text.js';
import { CommandGetResult, CommandParameter, ICommand } from '../../types.js';
import { humanize } from '../../utils/index.js';
import { Documentation, DocumentationGroup, DocumentationPage } from './DocumentationManager.js';
import { DocumentationTreeManager } from './DocumentationTreeManager.js';

const doc = templates.documentation.command;

export class CommandDocumentationManager extends DocumentationTreeManager {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super(cluster, 'cmd', doc.invalid, doc.prompt);
        this.#cluster = cluster;
    }

    protected async getTree(user: Eris.User, channel: Eris.KnownTextableChannel): Promise<Documentation> {
        const guild = guard.isGuildChannel(channel) ? channel.guild : undefined;
        const categories = new Map<string, DocumentationGroup & { items: Mutable<DocumentationGroup['items']>; }>();
        for await (const item of this.#cluster.commands.list(guild, user)) {
            if (item.state === 'NOT_FOUND')
                continue;

            const command = item.detail.command;
            const commandDocumentation = this.#getCommandDocs(item);

            for await (const categoryDesc of this.#getCategories(channel, command)) {
                let category = categories.get(categoryDesc.id);
                if (category === undefined) {
                    categories.set(categoryDesc.id, category = {
                        id: categoryDesc.id,
                        name: categoryDesc.name,
                        type: 'group',
                        items: [],
                        embed: {
                            color: commandDocumentation.embed.color
                        },
                        selectText: doc.categories.prompt
                    });
                }

                category.items.push({
                    ...commandDocumentation,
                    id: `${categoryDesc.id}_${commandDocumentation.id}`
                });
            }
        }

        const sortedCategories = [...categories.values()]
            .map(g => ({
                ...g,
                items: [...g.items].sort((a, b) => a.name < b.name ? -1 : 1),
                hidden: g.items.every(i => i.hidden === true),
                embed: {
                    ...g.embed,
                    fields: [
                        {
                            name: g.name,
                            value: this.#listCommandNames(g.items.filter(i => i.hidden !== true).map(i => i.name))
                        }
                    ]
                }
            }))
            .sort((a, b) => a.name < b.name ? -1 : 1);

        return {
            id: 'index',
            name: doc.index.name,
            tags: [''],
            type: 'group',
            embed: {
                color: 0x7289da,
                fields: [
                    ...sortedCategories.filter(g => g.hidden !== true).map(g => ({
                        name: doc.categories.displayName({ category: g.name }),
                        value: this.#listCommandNames(g.items.filter(i => i.hidden !== true).map(i => i.name))
                    })),
                    {
                        name: util.literal('\u200B'),
                        value: doc.index.footer({
                            commandsLink: this.#cluster.util.websiteLink('/commands'),
                            donateLink: this.#cluster.util.websiteLink('/donate')
                        })
                    }
                ]
            },
            selectText: doc.index.prompt,
            items: sortedCategories
        };
    }

    #listCommandNames(names: ReadonlyArray<IFormattable<string>>): IFormattable<string> {
        if (names.length === 0)
            return doc.list.none;

        function* getPotentialResults(): Generator<IFormattable<string>> {
            let removed = 0;
            const items = [...names];
            yield doc.list.default({ items });
            while (items.length > 0) {
                items.pop();
                removed++;
                yield doc.list.excess({ items, excess: removed });
            }
        }

        const charLimit = discord.getLimit('embed.field.value');
        return {
            [format](formatter) {
                for (const result of getPotentialResults()) {
                    const str = result[format](formatter);
                    if (str.length <= charLimit)
                        return str;
                }

                return doc.list.count({ count: names.length })[format](formatter);
            }
        };
    }

    protected noMatches(): Omit<SendContent<IFormattable<string>>, 'components'> {
        return {
            content: doc.unknown,
            embeds: []
        };
    }

    #getCommandDocs(result: Exclude<CommandGetResult, { state: 'NOT_FOUND'; }>): Documentation {
        let description;
        switch (result.state) {
            case 'ALLOWED':
                break;
            case 'BLACKLISTED':
            case 'DISABLED':
            case 'NOT_IN_GUILD':
            case 'MISSING_PERMISSIONS':
            case 'MISSING_ROLE':
                description = doc.command.noPerms({ name: result.detail.command.name, description: result.detail.command.description });
                break;
        }
        const { detail: { command } } = result;
        const fields: Array<FormatEmbedField<IFormattable<string>>> = [];
        description ??= command.description;

        if (command.aliases.length > 0)
            fields.push({ name: doc.command.aliases.name, value: doc.command.aliases.value({ aliases: command.aliases }) });

        if (command.flags.length > 0)
            fields.push({ name: doc.command.flags.name, value: doc.command.flags.value({ flags: command.flags }) });

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
                name: util.literal(usage),
                embed: {
                    fields: [
                        ...fields,
                        {
                            name: doc.command.usage.name({ usage }),
                            value: doc.command.usage.value({ notes: signature.notes, description: signature.description })
                        }
                    ]
                }
            });
        }

        return {
            id: command.id,
            name: util.literal(command.name),
            type: 'paged',
            hidden: result.state !== 'ALLOWED',
            tags: [command.name, ...command.aliases],
            embed: {
                url: command.isOnWebsite ? `/commands#${command.name}` : undefined,
                description: description,
                color: command.category.color
            },
            selectText: doc.command.prompt,
            pages: pages.sort((a, b) => a.name < b.name ? -1 : 1)
        };
    }

    *#getParameterNotes(parameter: CommandParameter): Generator<IFormattable<string>> {
        switch (parameter.kind) {
            case 'literal':
                if (parameter.alias.length > 0)
                    yield doc.command.notes.alias({ parameter: parameter.name, aliases: parameter.alias });
                break;
            case 'concatVar':
            case 'singleVar': {
                const fallback = parameter.fallback === undefined || parameter.fallback.length === 0 ? undefined : parameter.fallback;
                const type = parameter.type.type;
                if (typeof type !== 'string')
                    yield doc.command.notes.type.literal.single({ name: parameter.name, choices: parameter.type.type, default: fallback });
                else if (type !== 'string')
                    yield doc.command.notes.type[type].single({ name: parameter.name, default: fallback });
                else if (fallback !== undefined)
                    yield doc.command.notes.type[type].single({ name: parameter.name, default: fallback });
                break;
            }
            case 'greedyVar': {
                const type = parameter.type.type;
                if (typeof type !== 'string')
                    yield doc.command.notes.type.literal.greedy({ name: parameter.name, min: parameter.minLength, choices: parameter.type.type });
                else if (type !== 'string')
                    yield doc.command.notes.type[type].greedy({ name: parameter.name, min: parameter.minLength });
                break;
            }
        }
    }

    async *#getCategories(channel: Eris.KnownChannel, command: ICommand): AsyncGenerator<{ name: IFormattable<string>; id: string; }> {
        if (command.roles.length === 0)
            yield { name: command.category.name, id: `_${command.category.id}` };

        if (guard.isGuildChannel(channel)) {
            for (const roleStr of command.roles) {
                const role = await this.#cluster.util.getRole(channel.guild, roleStr)
                    ?? channel.guild.roles.find(r => r.name.toLowerCase() === roleStr.toLowerCase());

                if (role !== undefined)
                    yield { name: util.literal(role.name), id: role.id };
            }
        }
    }
}
