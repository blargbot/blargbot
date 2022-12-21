import type { MessageComponent } from '@blargbot/core/utils/index.js';
import { discord, guard, parse } from '@blargbot/core/utils/index.js';
import type * as Eris from 'eris';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { InvalidEmbedError } from '../../errors/index.js';

export class EmbedBuildSubtag extends Subtag {
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
        if (!guard.checkEmbedSize([<Eris.EmbedOptions>embed]))
            throw new InvalidEmbedError('Embed too long', JSON.stringify(embed));
        return embed as JObject;
    }

    #setField(embed: EmbedBuildOptions, key: string, value: string): void {
        const id = key.toLowerCase();
        if (!guard.hasProperty(fields, id))
            throw new InvalidEmbedError(`Unknown key '${key}'`);
        fields[id].set(embed, value.trim());
    }
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
// custom message for fields missing values/names
type EmbedBuildOptions = Overwrite<Eris.EmbedOptions, {
    fields?: Array<Partial<Eris.EmbedField>>;
    author?: Partial<Eris.EmbedAuthor>;
    footer?: Partial<Eris.EmbedFooter>;
}>
interface EmbedFieldDetails {
    readonly description?: string;
    (embed: EmbedBuildOptions, value: string): void;
}

function validateLength(value: { length: number; } | undefined, limitKey: MessageComponent, errorText: string): void {
    if (value !== undefined && value.length > discord.getLimit(limitKey))
        throw new InvalidEmbedError(errorText, typeof value === 'string' ? value : undefined);
}

function validateUrl(value: string, errorText: string): void {
    if (!guard.isUrl(value))
        throw new InvalidEmbedError(errorText, value);
}

function parseOrError<T>(value: string, parse: (value: string) => T | undefined, errorText: string, isValid: (value: T) => boolean = () => true): T {
    const result = parse(value);
    if (result === undefined || !isValid(result))
        throw new InvalidEmbedError(errorText, value);
    return result;
}

function getCurrentField(embed: EmbedBuildOptions, errorText: string): Partial<Eris.EmbedField> {
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
        const color = parseOrError(value, parse.color, 'Invalid color');
        embed.color = color;
    },
    'timestamp'(embed, value) {
        const date = parseOrError(value, parse.time, 'Invalid timestamp', t => t.isValid());
        embed.timestamp = date.toDate();
    },
    'fields.inline'(embed, value) {
        const field = getCurrentField(embed, 'Field name not specified');
        const inline = parseOrError(value, parse.boolean, 'Inline must be a boolean');
        field.inline = inline;
    }
};

const fields = Object.fromEntries(fieldKeys.map(k => [k, {
    set: fieldSetters[k]
}]));
