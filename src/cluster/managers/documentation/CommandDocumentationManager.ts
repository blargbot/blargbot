import { codeBlock, discord, guard, pluralise } from '@blargbot/core/utils';
import { AdvancedMessageContent, EmbedField, KnownChannel, KnownTextableChannel, User } from 'eris';

import { Cluster } from '../../Cluster';
import { CommandGetResult, CommandParameter, ICommand } from '../../types';
import { humanize } from '../../utils';
import { Documentation, DocumentationGroup, DocumentationPage } from './DocumentationManager';
import { DocumentationTreeManager } from './DocumentationTreeManager';

export class CommandDocumentationManager extends DocumentationTreeManager {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        super(cluster, `cmd`, `help`);
        this.#cluster = cluster;
    }

    protected async getTree(user: User, channel: KnownTextableChannel): Promise<Documentation> {
        const guild = guard.isGuildChannel(channel) ? channel.guild : undefined;
        const categories = new Map<string, DocumentationGroup & { items: Mutable<DocumentationGroup[`items`]>; }>();
        for await (const item of this.#cluster.commands.list(guild, user)) {
            if (item.state === `NOT_FOUND`)
                continue;

            const command = item.detail.command;
            const commandDocumentation = this.#getCommandDocs(item);

            for await (const categoryDesc of this.#getCategories(channel, command)) {
                let category = categories.get(categoryDesc.id);
                if (category === undefined) {
                    categories.set(categoryDesc.id, category = {
                        id: categoryDesc.id,
                        name: categoryDesc.name,
                        type: `group`,
                        items: [],
                        embed: {
                            color: commandDocumentation.embed.color
                        },
                        selectText: `Pick a command`
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
                            name: `${g.name} commands`,
                            value: this.#listCommandNames(g.items.filter(i => i.hidden !== true).map(i => i.name))
                        }
                    ]
                }
            }))
            .sort((a, b) => a.name < b.name ? -1 : 1);

        return {
            id: `index`,
            name: `Help`,
            tags: [``],
            type: `group`,
            embed: {
                color: 0x7289da,
                fields: [
                    ...sortedCategories.filter(g => g.hidden !== true).map(g => ({
                        name: `${g.name} commands`,
                        value: this.#listCommandNames(g.items.filter(i => i.hidden !== true).map(i => i.name))
                    })),
                    {
                        name: `\u200B`,
                        value: `For more information about commands, do \`b!help <commandname>\` or visit <${this.#cluster.util.websiteLink(`/commands`)}>.\nWant to support the bot? Donation links are available at <${this.#cluster.util.websiteLink(`/donate`)}> - all donations go directly towards recouping hosting costs.`
                    }
                ]
            },
            selectText: `Pick a command category`,
            items: sortedCategories
        };
    }

    #listCommandNames(names: readonly string[]): string {
        if (names.length === 0)
            return `No commands`;

        function* getPotentialResults(): Generator<string> {
            let removed = 0;
            const items = [...names];
            const padding = `\`\`\``;
            yield `${padding}${items.join(`, `)}${padding}`;
            while (items.length > 0) {
                items.pop();
                removed++;
                yield `${padding}${items.join(`, `)}${padding}+ ${removed} more`;
            }
        }

        const charLimit = discord.getLimit(`embed.field.value`);
        for (const result of getPotentialResults())
            if (result.length <= charLimit)
                return result;

        return `${names.length} ${pluralise(names.length, `command`)}`;
    }

    protected noMatches(): Awaitable<Omit<AdvancedMessageContent, `components`>> {
        return {
            content: `❌ Oops, I couldnt find that command! Try using \`b!help\` for a list of all commands`,
            embeds: []
        };
    }

    #getCommandDocs(result: Exclude<CommandGetResult, { state: `NOT_FOUND`; }>): Documentation {
        const description = [];
        switch (result.state) {
            case `ALLOWED`:
                break;
            case `BLACKLISTED`:
            case `DISABLED`:
            case `NOT_IN_GUILD`:
            case `MISSING_PERMISSIONS`:
            case `MISSING_ROLE`:
                description.push(codeBlock(`❌ You cannot use b!${result.detail.command.name}`));
                break;
        }
        const { detail: { command } } = result;
        const fields: EmbedField[] = [];
        if (command.description !== undefined && command.description.length > 0)
            description.push(command.description);

        if (command.aliases.length > 0)
            fields.push({ name: `**Aliases**`, value: command.aliases.join(`, `) });

        if (command.flags.length > 0)
            fields.push({ name: `**Flags**`, value: humanize.flags(command.flags).join(`\n`) });

        const signatures = command.signatures
            .filter(c => !c.hidden)
            .map(signature => ({
                usage: humanize.commandParameters(signature.parameters),
                description: signature.description,
                notes: signature.parameters.flatMap(p => [...this.#getParameterNotes(p)])
            }));

        const pages: DocumentationPage[] = [];
        for (const signature of signatures) {
            const usage = `b!${command.name}${signature.usage !== `` ? ` ${signature.usage}` : ``}`;
            pages.push({
                name: usage,
                embed: {
                    fields: [
                        ...fields,
                        {
                            name: `ℹ️  ${usage}`,
                            value: `${signature.notes.map(n => `> ${n}`).join(`\n`)}\n\n${signature.description}`.trim()
                        }
                    ]
                }
            });
        }

        return {
            id: command.id,
            name: command.name,
            type: `paged`,
            hidden: result.state !== `ALLOWED`,
            tags: [command.name, ...command.aliases],
            embed: {
                url: command.isOnWebsite ? `/commands#${command.name}` : undefined,
                description: description.join(`\n`),
                color: this.#getColor(command.category)
            },
            selectText: `Pick a command signature`,
            pages: pages.sort((a, b) => a.name < b.name ? -1 : 1)
        };
    }

    #getColor(type: string): number {
        switch (type.toLowerCase()) {
            case `custom`: return 0x7289da;
            case `general`: return 0xefff00;
            case `nsfw`: return 0x010101;
            case `image`: return 0xefff00;
            case `admin`: return 0xff0000;
            case `social`: return 0xefff00;
            case `owner`: return 0xff0000;
            case `developer`: return 0xff0000;
            case `staff`: return 0xff0000;
            case `support`: return 0xff0000;
            default: return 0;
        }
    }

    *#getParameterNotes(parameter: CommandParameter): Generator<string> {
        switch (parameter.kind) {
            case `literal`:
                if (parameter.alias.length > 0)
                    yield `\`${parameter.name}\` can be replaced with ${humanize.smartJoin(parameter.alias.map(a => `\`${a}\``), `, `, ` or `)}`;
                break;
            case `concatVar`:
            case `singleVar`: {
                const result = [];
                if (parameter.type.descriptionSingular !== undefined)
                    result.push(` should be ${parameter.type.descriptionSingular}`);
                if (parameter.fallback !== undefined && parameter.fallback.length > 0)
                    result.push(`defaults to \`${parameter.fallback}\``);
                if (result.length > 0)
                    yield `\`${parameter.name}\` ${result.join(` and `)}`;
                break;
            }
            case `greedyVar`: {
                const result = [];
                if (parameter.minLength > 1)
                    result.push(`${parameter.minLength} or more`);
                if (parameter.type.descriptionPlural !== undefined)
                    result.push(parameter.type.descriptionPlural);
                if (result.length > 0)
                    yield `\`${parameter.name}\` are ${result.join(` `)}`;
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
