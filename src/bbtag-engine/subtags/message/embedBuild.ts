import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidEmbedError } from '../../errors/index.js';
import { templates } from '../../text.js';
import type { Embed, EmbedAuthor, EmbedField, EmbedFooter } from '../../types.js';
import { convertToBoolean, convertToColor, convertToTimestamp } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { isUrl } from '../../utils/url.js';

const tag = templates.subtags.embedBuild;

export class EmbedBuildSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'embedBuild',
            category: SubtagType.MESSAGE,
            aliases: ['buildEmbed'],
            description: tag.description({ keys: fieldKeys }),
            definition: [
                {
                    parameters: ['values+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (_, args) => this.buildEmbed(args.map(arg => arg.value))
                }
            ]
        });
    }

    public buildEmbed(args: string[]): JObject {
        const embed: EmbedBuildOptions = {};

        for (const entry of args) {
            if (entry.trim() === '')
                continue;
            const splitAt = entry.indexOf(':');
            if (splitAt === -1)
                throw new InvalidEmbedError('Missing \':\'', entry);

            const key = entry.substring(0, splitAt);
            const value = entry.substring(splitAt + 1);

            this.#setField(embed, key.trim(), value);
        }

        if (embed.fields !== undefined) {
            for (let i = 0; i < embed.fields.length; i++) {
                const field = embed.fields[i];
                if ((field.value?.trim() ?? '') === '')
                    throw new InvalidEmbedError('Field missing value', `Field at index ${i}`);
                if ((field.name?.trim() ?? '') === '')
                    throw new InvalidEmbedError('Field missing name', `Field at index ${i}`);
            }
        }
        if (!checkEmbedSize([embed]))
            throw new InvalidEmbedError('Embed too long', JSON.stringify(embed));
        return embed as JObject;
    }

    #setField(embed: EmbedBuildOptions, key: string, value: string): void {
        const id = key.toLowerCase();
        if (!Object.hasOwn(fields, id))
            throw new InvalidEmbedError(`Unknown key '${key}'`);
        fields[id].set(embed, value.trim());
    }
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
// custom message for fields missing values/names
type EmbedBuildOptions = Overwrite<Embed, {
    fields?: Array<Partial<EmbedField>>;
    author?: Partial<EmbedAuthor>;
    footer?: Partial<EmbedFooter>;
}>
interface EmbedFieldDetails {
    readonly description?: string;
    (embed: EmbedBuildOptions, value: string): void;
}

function validateLength(value: { length: number; } | undefined, limitKey: MessageComponent, errorText: string): void {
    if (value !== undefined && value.length > getLimit(limitKey))
        throw new InvalidEmbedError(errorText, typeof value === 'string' ? value : undefined);
}

function validateUrl(value: string, errorText: string): void {
    if (!isUrl(value))
        throw new InvalidEmbedError(errorText, value);
}

function parseOrError<T>(value: string, parse: (value: string) => T | undefined, errorText: string, isValid: (value: T) => boolean = () => true): T {
    const result = parse(value);
    if (result === undefined || !isValid(result))
        throw new InvalidEmbedError(errorText, value);
    return result;
}

function getCurrentField(embed: EmbedBuildOptions, errorText: string): Partial<EmbedField> {
    if (embed.fields === undefined || embed.fields.length === 0)
        throw new InvalidEmbedError(errorText);
    return embed.fields[embed.fields.length - 1];
}

const fieldKeys = [
    'title',
    'description',
    'url',
    'color',
    'timestamp',
    'footer.icon_url',
    'footer.text',
    'thumbnail.url',
    'image.url',
    'author.name',
    'author.url',
    'author.icon_url',
    'fields.name',
    'fields.value',
    'fields.inline'
] as const;

const fieldSetters: Record<typeof fieldKeys[number], EmbedFieldDetails> = {
    'title'(embed, value) {
        validateLength(value, 'embed.title', 'Title too long');
        embed.title = value;
    },
    'description'(embed, value) {
        validateLength(value, 'embed.description', 'Description too long');
        embed.description = value;
    },
    'footer.text'(embed, value) {
        validateLength(value, 'embed.footer.text', 'Footer text too long');
        embed.footer ??= {};
        embed.footer.text = value;
    },
    'author.name'(embed, value) {
        validateLength(value, 'embed.author.name', 'Author name too long');
        embed.author ??= {};
        embed.author.name = value;
    },
    'fields.name'(embed, value) {
        validateLength(value, 'embed.field.name', 'Field name too long');
        embed.fields ??= [];
        embed.fields.push({ name: value });
        validateLength(embed.fields, 'embed.fields', 'Too many fields');
    },
    'fields.value'(embed, value) {
        const field = getCurrentField(embed, 'Field name not specified');
        validateLength(value, 'embed.field.value', 'Field value too long');
        field.value = value;
    },
    'url'(embed, value) {
        validateUrl(value, 'Invalid url');
        embed.url = value;
    },
    'footer.icon_url'(embed, value) {
        validateUrl(value, 'Invalid footer.icon_url');
        embed.footer ??= { text: '\u200b' };
        embed.footer.icon_url = value;
    },
    'thumbnail.url'(embed, value) {
        validateUrl(value, 'Invalid thumbnail.url');
        embed.thumbnail ??= {};
        embed.thumbnail.url = value;
    },
    'image.url'(embed, value) {
        validateUrl(value, 'Invalid image.url');
        embed.image ??= {};
        embed.image.url = value;
    },
    'author.url'(embed, value) {
        validateUrl(value, 'Invalid author.url');
        embed.author ??= { name: '\u200b' };
        embed.author.url = value;
    },
    'author.icon_url'(embed, value) {
        validateUrl(value, 'Invalid author.icon_url');
        embed.author ??= { name: '\u200b' };
        embed.author.icon_url = value;
    },
    'color'(embed, value) {
        const color = parseOrError(value, convertToColor, 'Invalid color');
        embed.color = color;
    },
    'timestamp'(embed, value) {
        const date = parseOrError(value, convertToTimestamp, 'Invalid timestamp');
        embed.timestamp = date.toInstant();
    },
    'fields.inline'(embed, value) {
        const field = getCurrentField(embed, 'Field name not specified');
        const inline = parseOrError(value, convertToBoolean, 'Inline must be a boolean');
        field.inline = inline;
    }
};

const fields = Object.fromEntries(fieldKeys.map(k => [k, {
    set: fieldSetters[k]
}]));
function getLimit(component: MessageComponent): number {
    switch (component) {
        case 'content': return 2000;
        case 'embed.title': return 256;
        case 'embed.description': return 4096;
        case 'embed.fields': return 25;
        case 'embed.field.name': return 256;
        case 'embed.field.value': return 1024;
        case 'embed.footer.text': return 2048;
        case 'embed.author.name': return 256;
        case 'embeds': return 6000;
    }
}

function checkEmbedSize(embed: readonly EmbedBuildOptions[] | undefined): boolean {
    if (embed === undefined) return true;
    for (const [value, limit] of getEmbedValueLimits(embed))
        if (value !== undefined && value !== null && value.length > limit)
            return false;

    return true;
}

function* getEmbedValueLimits(embeds: readonly EmbedBuildOptions[]): IterableIterator<[value: { length: number; } | null | undefined, limit: number]> {
    const allValues: string[] = [];
    const append = <T>(value: T): T => {
        if (typeof value === 'string')
            allValues.push(value);
        return value;
    };

    // Limits come from the discord documentation
    // https://discord.com/developers/docs/resources/channel#embed-limits

    for (const embed of embeds) {
        yield [append(embed.title), getLimit('embed.title')];
        yield [append(embed.description), getLimit('embed.description')];
        yield [embed.fields, getLimit('embed.fields')];
        for (const field of embed.fields ?? []) {
            yield [append(field.name), getLimit('embed.field.name')];
            yield [append(field.value), getLimit('embed.field.value')];
        }
        yield [append(embed.footer?.text), getLimit('embed.footer.text')];
        yield [append(embed.author?.name), getLimit('embed.author.name')];
    }

    yield [allValues.join(''), getLimit('embeds')];

}

type MessageStringComponent =
    | 'content'
    | 'embed.title'
    | 'embed.description'
    | 'embed.field.name'
    | 'embed.field.value'
    | 'embed.footer.text'
    | 'embed.author.name'

type MessageComponent =
    | MessageStringComponent
    | 'embed.fields'
    | 'embeds'
