import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { FormatActionRow, FormatButton, FormatEmbedField, FormatEmbedOptions, FormatSelectMenu, FormatSelectMenuOptions, SendContent } from '@blargbot/core/types';
import { IFormattable, IFormatter } from '@blargbot/domain/messages/types';
import { ComponentInteraction, Constants, KnownInteraction, KnownTextableChannel, User } from 'eris';
import moment from 'moment-timezone';

import { Cluster } from '../../Cluster';
import templates from '../../text';

export type Documentation = DocumentationGroup | DocumentationLeaf | DocumentationPaged;

export interface DocumentationBase {
    readonly id: string;
    readonly name: IFormattable<string>;
    readonly tags?: ReadonlyArray<string | IFormattable<string>>;
    readonly hidden?: boolean;
}

export interface DocumentationGroup extends DocumentationBase {
    readonly type: `group`;
    readonly items: readonly Documentation[];
    readonly selectText: IFormattable<string>;
    readonly embed: Pick<FormatEmbedOptions<IFormattable<string>>, `color` | `description` | `url` | `image` | `thumbnail` | `fields`>;
}

export interface DocumentationLeaf extends DocumentationBase {
    readonly type: `single`;
    readonly embed: Pick<FormatEmbedOptions<IFormattable<string>>, `color` | `description` | `url` | `image` | `thumbnail` | `fields`>;
}

export interface DocumentationPaged extends DocumentationBase {
    readonly type: `paged`;
    readonly pages: readonly DocumentationPage[];
    readonly selectText: IFormattable<string>;
    readonly embed: Pick<FormatEmbedOptions<IFormattable<string>>, `color` | `description` | `url` | `image` | `thumbnail`>;
}

export interface DocumentationPage {
    readonly name: IFormattable<string>;
    readonly embed: Pick<FormatEmbedOptions<IFormattable<string>>, `fields`>;
}

interface DocumentationPageIdData {
    readonly userId: string;
    readonly documentationId: string;
    readonly pageGroup: number;
    readonly pageNumber: number;
}

export abstract class DocumentationManager {
    readonly #id: string;
    readonly #invalid: IFormattable<string>;
    readonly #pickPlaceholder: (value: { term: string; }) => IFormattable<string>;
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster, id: string, invalid: IFormattable<string>, pickPlaceholder: (value: { term: string; }) => IFormattable<string>) {
        this.#cluster = cluster;
        this.#id = id;
        this.#invalid = invalid;
        this.#pickPlaceholder = pickPlaceholder;
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
        const segments = value.split(`|`);
        if (segments.length < 5)
            return undefined;

        const [id, userIdComp, pageGroupComp, pageNumberComp, ...documentationIdSeg] = segments;
        const documentationId = documentationIdSeg.join(`|`);

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
            hex = `0${hex}`;
        const buf = Buffer.from(hex, `hex`);
        return buf.toString(`base64url`); // Might use another base, maybe base128 for even denser values
    }

    #decompress(value: string): bigint {
        const buf = Buffer.from(value, `base64url`);
        const hex = buf.toString(`hex`);
        return BigInt(`0x${hex}`);
    }

    protected abstract findDocumentation(term: string, user: User, channel: KnownTextableChannel, formatter: IFormatter): Awaitable<readonly Documentation[]>;
    protected abstract getDocumentation(documentationId: string, user: User, channel: KnownTextableChannel): Awaitable<Documentation | undefined>;
    protected abstract getParent(documentationId: string, user: User, channel: KnownTextableChannel): Awaitable<Documentation | undefined>;
    protected abstract noMatches(term: string, user: User, channel: KnownTextableChannel): Awaitable<SendContent<IFormattable<string>>>;

    public async createMessageContent(term: string, user: User, channel: KnownTextableChannel): Promise<SendContent<IFormattable<string>>> {
        const formatter = await this.#cluster.util.getFormatter(channel);
        const choices = await this.findDocumentation(term, user, channel, formatter);
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

        const formatter = await this.#cluster.util.getFormatter(interaction.channel);
        const user = interaction.member?.user ?? interaction.user;
        if (user?.id !== idData.userId) {
            await interaction.createMessage({
                content: templates.common.query.cantUse.format(formatter),
                flags: Constants.MessageFlags.EPHEMERAL
            });
            return;
        }

        await interaction.editParent({
            embeds: [
                {
                    title: templates.documentation.loading.format(formatter)
                }
            ],
            components: []
        });

        const channel = interaction.channel as KnownTextableChannel;
        const documentation = await this.getDocumentation(idData.documentationId, user, channel);
        if (documentation === undefined) {
            await interaction.createMessage({
                content: this.#invalid.format(formatter),
                flags: Constants.MessageFlags.EPHEMERAL
            });
            return;
        }

        const content = await this.#render(documentation, idData, user, channel, interaction);
        await interaction.editParent(new FormattableMessageContent(content).format(formatter));
    }

    async #render(documentation: Documentation, idData: DocumentationPageIdData, user: User, channel: KnownTextableChannel, interaction: ComponentInteraction): Promise<SendContent<IFormattable<string>>> {
        switch (interaction.data.component_type) {
            case 2: //ComponentType.Button
                return await this.#renderDocumentation(documentation, idData.pageGroup, idData.pageNumber, user, channel);
            case 3: { //ComponentType.SelectMenu
                switch (documentation.type) {
                    case `group`: {
                        const documentation = await this.getDocumentation(interaction.data.values[0], user, channel);
                        if (documentation === undefined)
                            return await this.noMatches(interaction.data.values[0], user, channel);
                        return await this.#renderDocumentation(documentation, 0, 0, user, channel);
                    }
                    case `single`:
                        return await this.#renderDocumentation(documentation, idData.pageGroup, idData.pageNumber, user, channel);
                    case `paged`:
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
            placeholder: this.#pickPlaceholder({ term })
        });

        switch (selected.state) {
            case `CANCELLED`:
            case `FAILED`:
            case `NO_OPTIONS`:
            case `TIMED_OUT`:
                return undefined;
            case `SUCCESS`:
                return selected.value;
        }
    }

    async #renderDocumentation(documentation: Documentation, pageGroup: number, pageNumber: number, user: User, channel: KnownTextableChannel): Promise<SendContent<IFormattable<string>>> {
        const parent = await this.getParent(documentation.id, user, channel);
        const gotoParent: FormatButton<IFormattable<string>> | undefined = parent === undefined ? undefined : {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: this.#createCustomId({ documentationId: parent.id, pageGroup: 0, pageNumber: 0, userId: user.id }),
            style: Constants.ButtonStyles.PRIMARY,
            emoji: { name: `⬆` },
            label: templates.documentation.paging.parent({ parent: parent.name })
        };

        switch (documentation.type) {
            case `group`: return this.#renderDocumentationGroup(gotoParent, documentation, pageGroup, pageNumber, user);
            case `paged`: return this.#renderDocumentationPaged(gotoParent, documentation, pageGroup, pageNumber, user);
            case `single`: return this.#renderDocumentationSingle(gotoParent, documentation, user);
        }
    }

    #createPrevButton(id: string, pageGroup: number, pageNumber: number, userId: string): FormatButton<IFormattable<string>> {
        return {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: this.#createCustomId({ documentationId: id, pageGroup, pageNumber, userId }),
            style: Constants.ButtonStyles.PRIMARY,
            disabled: pageGroup === 0,
            emoji: { name: `⬅` }
        };
    }

    #createNextButton(id: string, pageGroup: number, pageNumber: number, userId: string, pageCount: number): FormatButton<IFormattable<string>> {
        return {
            type: Constants.ComponentTypes.BUTTON,
            custom_id: this.#createCustomId({ documentationId: id, pageGroup, pageNumber, userId }),
            style: Constants.ButtonStyles.PRIMARY,
            disabled: pageGroup >= pageCount - 1,
            emoji: { name: `➡` }
        };
    }

    #createPageSelect<T>(
        id: string,
        pageGroup: number,
        pageNumber: number,
        pageSize: number,
        pageCount: number,
        userId: string,
        options: readonly T[],
        placeholder: IFormattable<string>,
        selector: (doc: T, index: number) => FormatSelectMenuOptions<IFormattable<string>>
    ): FormatSelectMenu<IFormattable<string>> {
        return {
            type: Constants.ComponentTypes.SELECT_MENU,
            custom_id: this.#createCustomId({ documentationId: id, pageGroup, pageNumber, userId }),
            placeholder: options.length > pageSize
                ? templates.documentation.paging.select.placeholder({
                    text: placeholder,
                    page: pageGroup + 1,
                    pageCount: pageCount
                })
                : placeholder,
            options: options
                .slice(pageGroup * pageSize, (pageGroup + 1) * pageSize)
                .map(selector)
        };
    }

    #createPageControls<T>(
        gotoParent: FormatButton<IFormattable<string>> | undefined,
        id: string,
        pageGroup: number,
        pageNumber: number,
        pageSize: number,
        userId: string,
        options: readonly T[],
        placeholder: IFormattable<string>,
        selector: (doc: T, index: number) => FormatSelectMenuOptions<IFormattable<string>>
    ): Array<FormatActionRow<IFormattable<string>>> {
        const pageCount = Math.floor((options.length - 1) / pageSize) + 1;
        const prevPageGroup = this.#createPrevButton(id, pageGroup - 1, pageNumber, userId);
        const nextPageGroup = this.#createNextButton(id, pageGroup + 1, pageNumber, userId, pageCount);
        const pageSelect = this.#createPageSelect(id, pageGroup, pageNumber, pageSize, pageCount, userId, options, placeholder, selector);

        const buttonRow = [];
        if (prevPageGroup.disabled !== true || nextPageGroup.disabled !== true)
            buttonRow.push(prevPageGroup, nextPageGroup);

        if (gotoParent !== undefined)
            buttonRow.splice(1, 0, gotoParent); // between paging buttons

        const components = [];
        if (pageSelect.options.some(opt => opt.default !== true))
            components.push({ type: Constants.ComponentTypes.ACTION_ROW, components: [pageSelect] });

        if (buttonRow.length > 0)
            components.push({ type: Constants.ComponentTypes.ACTION_ROW, components: buttonRow });

        return components;
    }

    #createDocumentationEmbed(documentation: Documentation, user: User, fields?: Array<FormatEmbedField<IFormattable<string>>>): FormatEmbedOptions<IFormattable<string>> {
        return {
            title: documentation.name,
            url: documentation.embed.url === undefined ? undefined : this.#cluster.util.websiteLink(documentation.embed.url),
            description: documentation.embed.description,
            color: documentation.embed.color,
            image: documentation.embed.image,
            thumbnail: documentation.embed.thumbnail,
            fields: fields,
            author: this.#cluster.util.embedifyAuthor(user),
            timestamp: moment().toDate()
        };
    }

    #renderDocumentationGroup(gotoParent: FormatButton<IFormattable<string>> | undefined, documentation: DocumentationGroup, pageGroup: number, pageNumber: number, user: User): SendContent<IFormattable<string>> {
        return {
            embeds: [
                this.#createDocumentationEmbed(documentation, user, documentation.embed.fields)
            ],
            components: this.#createPageControls(
                gotoParent,
                documentation.id,
                pageGroup,
                pageNumber,
                25,
                user.id,
                documentation.items.filter(opt => opt.hidden !== true),
                documentation.selectText,
                p => ({
                    label: p.name,
                    value: p.id
                })
            )
        };
    }

    #renderDocumentationPaged(gotoParent: FormatButton<IFormattable<string>> | undefined, documentation: DocumentationPaged, pageGroup: number, pageNumber: number, user: User): SendContent<IFormattable<string>> {
        return {
            embeds: [
                this.#createDocumentationEmbed(documentation, user, documentation.pages[pageNumber]?.embed.fields)
            ],
            components: this.#createPageControls(
                gotoParent,
                documentation.id,
                pageGroup,
                pageNumber,
                25,
                user.id,
                documentation.pages,
                documentation.selectText,
                (p, i) => ({
                    label: p.name,
                    value: i.toString(),
                    default: pageNumber === i
                })
            )
        };
    }
    #renderDocumentationSingle(gotoParent: FormatButton<IFormattable<string>> | undefined, documentation: DocumentationLeaf, user: User): SendContent<IFormattable<string>> {
        return {
            embeds: [
                this.#createDocumentationEmbed(documentation, user, documentation.embed.fields)
            ],
            components: gotoParent === undefined ? undefined : [
                {
                    type: Constants.ComponentTypes.ACTION_ROW,
                    components: [
                        gotoParent
                    ]
                }
            ]
        };
    }
}
