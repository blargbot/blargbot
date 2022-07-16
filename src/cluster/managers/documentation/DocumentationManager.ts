import { ActionRow, AdvancedMessageContent, Button, ComponentInteraction, Constants, EmbedOptions, KnownInteraction, KnownTextableChannel, SelectMenu, User } from 'eris';
import moment from 'moment-timezone';

import { Cluster } from '../../Cluster';

export type Documentation = DocumentationGroup | DocumentationLeaf | DocumentationPaged;

export interface DocumentationBase {
    readonly id: string;
    readonly name: string;
    readonly tags?: readonly string[];
    readonly hidden?: boolean;
}

export interface DocumentationGroup extends DocumentationBase {
    readonly type: 'group';
    readonly items: readonly Documentation[];
    readonly selectText: string;
    readonly embed: Pick<EmbedOptions, 'color' | 'description' | 'url' | 'image' | 'thumbnail' | 'fields'>;
}

export interface DocumentationLeaf extends DocumentationBase {
    readonly type: 'single';
    readonly embed: Pick<EmbedOptions, 'color' | 'description' | 'url' | 'image' | 'thumbnail' | 'fields'>;
}

export interface DocumentationPaged extends DocumentationBase {
    readonly type: 'paged';
    readonly pages: readonly DocumentationPage[];
    readonly selectText: string;
    readonly embed: Pick<EmbedOptions, 'color' | 'description' | 'url' | 'image' | 'thumbnail'>;
}

export interface DocumentationPage {
    readonly name: string;
    readonly embed: Pick<EmbedOptions, 'fields'>;
}

interface DocumentationPageIdData {
    readonly userId: string;
    readonly documentationId: string;
    readonly pageGroup: number;
    readonly pageNumber: number;
}

export abstract class DocumentationManager {
    readonly #id: string;
    readonly #name: string;
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster, id: string, name: string) {
        this.#cluster = cluster;
        this.#id = id;
        this.#name = name;
    }

    #createCustomId(details: DocumentationPageIdData): string {
        const userIdComp = this.#compress(BigInt(details.userId));
        const pageGroupComp = this.#compress(BigInt(details.pageGroup));
        const pageNumberComp = this.#compress(BigInt(details.pageNumber));

        const result = `${this.#id}|${userIdComp}|${pageGroupComp}|${pageNumberComp}|${details.documentationId}`;
        if (result.length > 100)
            throw new Error(`Documentation id ${JSON.stringify(details.documentationId)} was too long, causing the custom_id to be ${result.length} chars long`);
        return result;
    }

    #tryReadCustomId(value: string): DocumentationPageIdData | undefined {
        const segments = value.split('|');
        if (segments.length < 5)
            return undefined;

        const [id, userIdComp, pageGroupComp, pageNumberComp, ...documentationIdSeg] = segments;
        const documentationId = documentationIdSeg.join('|');

        if (id !== this.#id)
            return undefined;

        const userId = this.#decompress(userIdComp).toString();
        const pageNumber = Number(this.#decompress(pageNumberComp));
        const pageGroup = Number(this.#decompress(pageGroupComp));

        if (isNaN(pageNumber) || isNaN(pageGroup))
            return undefined;

        return { documentationId, pageGroup, pageNumber, userId };

    }

    #compress(value: bigint): string {
        let hex = value.toString(16);
        if (hex.length % 2 === 1) // Buffer.from(str, 'hex') needs str to be even in length
            hex = '0' + hex;
        const buf = Buffer.from(hex, 'hex');
        return buf.toString('base64').replaceAll('=', ''); // Might use another base, maybe base128 for even denser values
    }

    #decompress(value: string): bigint {
        const buf = Buffer.from(value, 'base64');
        const hex = buf.toString('hex');
        return BigInt('0x' + hex);
    }

    protected abstract findDocumentation(term: string, user: User, channel: KnownTextableChannel): Awaitable<readonly Documentation[]>;
    protected abstract getDocumentation(documentationId: string, user: User, channel: KnownTextableChannel): Awaitable<Documentation | undefined>;
    protected abstract getParent(documentationId: string, user: User, channel: KnownTextableChannel): Awaitable<Documentation | undefined>;
    protected abstract noMatches(term: string, user: User, channel: KnownTextableChannel): Awaitable<Omit<AdvancedMessageContent, 'components'>>;

    public async createMessageContent(term: string, user: User, channel: KnownTextableChannel): Promise<AdvancedMessageContent> {
        const choices = await this.findDocumentation(term, user, channel);
        const documentation = choices.length > 1 ? await this.#pickDocumentation(choices, term, user, channel) : choices[0];
        if (documentation === undefined)
            return await this.noMatches(term, user, channel);
        return await this.#renderDocumentation(documentation, 0, 0, user, channel);
    }

    public handleInteraction(interaction: KnownInteraction): void {
        void this.#handleInteraction(interaction)
            .catch(err => this.#cluster.logger.error(err));
    }

    async #handleInteraction(interaction: KnownInteraction): Promise<void> {
        if (interaction.acknowledged || !(interaction instanceof ComponentInteraction))
            return;

        const idData = this.#tryReadCustomId(interaction.data.custom_id);
        if (idData === undefined)
            return;

        const user = interaction.member?.user ?? interaction.user;
        if (user?.id !== idData.userId) {
            await interaction.createMessage({ content: '❌ This isn\'t for you to use!', flags: Constants.MessageFlags.EPHEMERAL });
            return;
        }

        await interaction.editParent({
            embeds: [{ title: 'Loading...' }],
            components: []
        });

        const channel = interaction.channel as KnownTextableChannel;
        const documentation = await this.getDocumentation(idData.documentationId, user, channel);
        if (documentation === undefined) {
            await interaction.createMessage({ content: `❌ This ${this.#name} documentation isn't valid any more!`, flags: Constants.MessageFlags.EPHEMERAL });
            return;
        }

        const content = await this.#render(documentation, idData, user, channel, interaction);
        await interaction.editParent(content);
    }

    async #render(documentation: Documentation, idData: DocumentationPageIdData, user: User, channel: KnownTextableChannel, interaction: ComponentInteraction): Promise<AdvancedMessageContent> {
        switch (interaction.data.component_type) {
            case 2: //ComponentType.Button
                return await this.#renderDocumentation(documentation, idData.pageGroup, idData.pageNumber, user, channel);
            case 3: { //ComponentType.SelectMenu
                switch (documentation.type) {
                    case 'group': {
                        const documentation = await this.getDocumentation(interaction.data.values[0], user, channel);
                        if (documentation === undefined)
                            return await this.noMatches(interaction.data.values[0], user, channel);
                        return await this.#renderDocumentation(documentation, 0, 0, user, channel);
                    }
                    case 'single':
                        return await this.#renderDocumentation(documentation, idData.pageGroup, idData.pageNumber, user, channel);
                    case 'paged':
                        return await this.#renderDocumentation(documentation, idData.pageGroup, Number(interaction.data.values[0]), user, channel);
                }
            }
        }
    }

    async #pickDocumentation(choices: readonly Documentation[], term: string, user: User, channel: KnownTextableChannel): Promise<Documentation | undefined> {
        const selected = await this.#cluster.util.queryChoice({
            actors: [user],
            choices: choices.map(c => ({
                label: c.name,
                value: c
            })),
            context: channel,
            placeholder: `Multiple ${this.#name} documentation match \`${term}\``
        });

        switch (selected.state) {
            case 'CANCELLED':
            case 'FAILED':
            case 'NO_OPTIONS':
            case 'TIMED_OUT':
                return undefined;
            case 'SUCCESS':
                return selected.value;
        }
    }

    async #renderDocumentation(documentation: Documentation, pageGroup: number, pageNumber: number, user: User, channel: KnownTextableChannel): Promise<AdvancedMessageContent> {
        const parent = await this.getParent(documentation.id, user, channel);
        const prevPageGroup: Button = {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: this.#createCustomId({ documentationId: documentation.id, pageGroup: pageGroup - 1, pageNumber, userId: user.id }),
            style: Constants.ButtonStyles.PRIMARY,
            disabled: pageGroup === 0,
            emoji: { name: '⬅' }
        };

        const [selectOptions, selectText] = documentation.type === 'group' ? [documentation.items.filter(opt => opt.hidden !== true), documentation.selectText]
            : documentation.type === 'paged' ? [documentation.pages, documentation.selectText]
                : [[], ''];

        const lastPage = Math.floor((selectOptions.length - 1) / 25);
        const nextPageGroup: Button = {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: this.#createCustomId({ documentationId: documentation.id, pageGroup: pageGroup + 1, pageNumber, userId: user.id }),
            style: Constants.ButtonStyles.PRIMARY,
            disabled: pageGroup >= lastPage,
            emoji: { name: '➡' }
        };

        const gotoParent: Button = {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: this.#createCustomId({ documentationId: parent?.id ?? '', pageGroup: 0, pageNumber: 0, userId: user.id }),
            style: Constants.ButtonStyles.PRIMARY,
            disabled: parent === undefined,
            emoji: { name: '⬆' },
            label: `Back to ${parent?.name ?? ''}`
        };

        const pageSelect: SelectMenu = {
            type: Constants.ComponentTypes.SELECT_MENU,
            custom_id: this.#createCustomId({ documentationId: documentation.id, pageGroup, pageNumber, userId: user.id }),
            placeholder: selectOptions.length > 25 ? `${selectText} - Page ${pageGroup + 1}/${lastPage + 1}` : selectText,
            options: selectOptions
                .map((p, i) => ({
                    label: p.name,
                    value: 'id' in p ? p.id : i.toString(),
                    default: documentation.type === 'paged' && pageNumber === i
                }))
                .slice(pageGroup * 25, (pageGroup + 1) * 25)
        };

        const buttonRow = [];
        if (prevPageGroup.disabled !== true || nextPageGroup.disabled !== true)
            buttonRow.push(prevPageGroup, nextPageGroup);

        if (gotoParent.disabled !== true)
            buttonRow.splice(1, 0, gotoParent); // between paging buttons

        const components: ActionRow[] = [];

        if (pageSelect.options.some(opt => opt.default !== true))
            components.push({ type: Constants.ComponentTypes.ACTION_ROW, components: [pageSelect] });

        if (buttonRow.length > 0)
            components.push({ type: Constants.ComponentTypes.ACTION_ROW, components: buttonRow });

        const page = documentation.type === 'paged' ? documentation.pages[pageNumber] ?? { embed: {} }
            : documentation;

        return {
            embed: {
                title: documentation.name,
                url: documentation.embed.url === undefined ? undefined : this.#cluster.util.websiteLink(documentation.embed.url),
                description: documentation.embed.description,
                color: documentation.embed.color,
                image: documentation.embed.image,
                thumbnail: documentation.embed.thumbnail,
                fields: page.embed.fields,
                author: this.#cluster.util.embedifyAuthor(user),
                timestamp: moment().toDate()
            },
            components
        };
    }
}
