import type { MessageComponent } from '@blargbot/discord-util';
import { checkEmbedSize, getMessageComponentLimit } from '@blargbot/discord-util';
import { hasProperty, isUrl } from '@blargbot/guards';
import type Discord from '@blargbot/discord-types';

import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidEmbedError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.embedBuild;

@Subtag.names('embedBuild', 'buildEmbed')
@Subtag.ctorArgs(Subtag.converter())
export class EmbedBuildSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #fieldSetters: Record<typeof fieldKeys[number], EmbedFieldSetter>;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MESSAGE,
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

        this.#converter = converter;
        this.#fieldSetters = fieldSetters(this.#converter);
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
        if (!hasProperty(this.#fieldSetters, id))
            throw new InvalidEmbedError(`Unknown key '${key}'`);
        this.#fieldSetters[id](embed, value.trim());
    }
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
// custom message for fields missing values/names
type EmbedBuildOptions = Overwrite<Discord.APIEmbed, {
    fields?: Array<Partial<Discord.APIEmbedField>>;
    author?: Partial<Discord.APIEmbedAuthor>;
    footer?: Partial<Discord.APIEmbedFooter>;
    thumbnail?: Partial<Discord.APIEmbedThumbnail>;
    image?: Partial<Discord.APIEmbedThumbnail>;
}>

interface EmbedFieldSetter {
    readonly description?: string;
    (embed: EmbedBuildOptions, value: string): void;
}

function validateLength(value: { length: number; } | undefined, limitKey: MessageComponent, errorText: string): void {
    if (value !== undefined && value.length > getMessageComponentLimit(limitKey))
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

function getCurrentField(embed: EmbedBuildOptions, errorText: string): Partial<Discord.APIEmbedField> {
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

function fieldSetters(converter: BBTagValueConverter): Record<typeof fieldKeys[number], EmbedFieldSetter> {
    return {
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
            const color = parseOrError(value, converter.color, 'Invalid color');
            embed.color = color;
        },
        'timestamp'(embed, value) {
            const date = parseOrError(value, converter.time, 'Invalid timestamp', t => t.isValid());
            embed.timestamp = date.toDate().toISOString();
        },
        'fields.inline'(embed, value) {
            const field = getCurrentField(embed, 'Field name not specified');
            const inline = parseOrError(value, converter.boolean, 'Inline must be a boolean');
            field.inline = inline;
        }
    };
}
