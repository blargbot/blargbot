import { DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, guard, parse, SubtagType } from '@cluster/utils';
import { EmbedField, EmbedOptions } from 'eris';

const fields = [
    {
        key: 'title'
    },
    {
        key: 'description'
    },
    {
        key: 'url'
    },
    {
        key: 'color',
        desc: 'can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number.'
    },
    {
        key: 'timestamp'
    },
    {
        key: 'footer.icon_url'
    },
    {
        key: 'footer.text'
    },
    {
        key: 'thumbnail.url'
    },
    {
        key: 'image.url'
    },
    {
        key: 'author.name'
    },
    {
        key: 'author.url'
    },
    {
        key: 'author.icon_url'
    },
    {
        key: 'fields.name',
        desc: 'Must have `fields.value` after. Cannot be empty.'
    },
    {
        key: 'fields.value',
        desc: 'Must come after a `fields.name`. Cannot be empty'
    },
    {
        key: 'fields.inline',
        desc: 'Must come after a `fields.name`'
    }
];

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
// custom message for fields missing values/names
type EmbedBuildOptions = Overwrite<EmbedOptions, { fields?: Array<Partial<EmbedField>>; }>

export class EmbedBuildSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'embedbuild',
            category: SubtagType.MESSAGE,
            aliases: ['buildembed'],
            desc: 'This tag is designed to allow you to generate embed code for `{webhook}` and `{embed}` with much less effort.\n' +
                'This tag uses a key/value system, with each entry in `values` looking like `key:value`.\n\n' +
                'Valid keys are:\n' + fields.map(k => '`' + k.key + '`' + (k.desc === undefined ? '' : ' - ' + k.desc)).join('\n') + '\n\n' +
                'You can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) ' +
                'and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds ' +
                '[here](https://leovoel.github.io/embed-visualizer/)',
            definition: [
                {
                    parameters: ['values+'],
                    exampleCode: '{embedbuild;\n  title:hello!;\n  description:I am an example embed;\n  fields.name:Field 1;\n  fields.value:This is the first field!;\n  ' +
                        'fields.name:Field 2;\n  fields.value:This is the next field and is inline!;\n  fields.inline:true\n}',
                    exampleOut: '{"title":"hello!","description":"I am an example embed","fields":[' +
                        '{"name":"Field 1","value":"This is the first field!"},' +
                        '{"name":"Field 2","value":"This is the next field and is inline!","inline":true}]}',
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
                throw new BBTagRuntimeError('Missing \':\'', entry);

            const key = entry.substring(0, splitAt);
            const value = entry.substring(splitAt + 1);

            this.setField(embed, key, value);
        }

        if (embed.fields !== undefined) {
            for (let i = 0; i < embed.fields.length; i++) {
                const field = embed.fields[i];
                if ((field.value?.trim() ?? '') === '')
                    throw new BBTagRuntimeError('Fields missing value', `Field at index ${i}`);
                if ((field.name?.trim() ?? '') === '')
                    throw new BBTagRuntimeError('Field missing name', `Field at index ${i}`);
            }
        }
        if (!guard.checkEmbedSize([<EmbedOptions>embed]))
            throw new BBTagRuntimeError('Embed too long', JSON.stringify(embed));
        return embed as JObject;
    }

    private setField(
        embed: EmbedBuildOptions,
        key: string,
        value: string
    ): void {
        switch (key.toLowerCase()) {
            case 'title':
                if (value.length > discordUtil.getLimit('embed.title'))
                    throw new BBTagRuntimeError('Title too long', value);
                embed.title = value;
                break;
            case 'description':
                if (value.length > discordUtil.getLimit('embed.description'))
                    throw new BBTagRuntimeError('Description too long', value);
                embed.description = value;
                break;
            case 'url':
                if (!guard.isUrl(value))
                    throw new BBTagRuntimeError('Invalid url', value);
                embed.url = value;
                break;
            case 'color': {
                const colour = parse.color(value);
                if (colour === undefined)
                    throw new BBTagRuntimeError('Invalid color', value);
                embed.color = colour;
                break;
            }
            case 'timestamp': {
                const time = parse.time(value);
                if (!time.isValid())
                    throw new BBTagRuntimeError('Invalid timestamp', value);
                embed.timestamp = time.toDate();
                break;
            }
            case 'footer.icon_url':
                if (!guard.isUrl(value))
                    throw new BBTagRuntimeError('Invalid footer.icon_url', value);
                embed.footer = { text: '', ...embed.footer, icon_url: value };
                break;
            case 'footer.text':
                if (value.length > discordUtil.getLimit('embed.footer.text'))
                    throw new BBTagRuntimeError('Footer text too long', value);
                embed.footer = { ...embed.footer, text: value };
                break;
            case 'thumbnail.url':
                if (!guard.isUrl(value))
                    throw new BBTagRuntimeError('Invalid thumbnail.url', value);
                embed.thumbnail = { ...embed.thumbnail, url: value };
                break;
            case 'image.url':
                if (!guard.isUrl(value))
                    throw new BBTagRuntimeError('Invalid image.url', value);
                embed.image = { ...embed.image, url: value };
                break;
            case 'author.name':
                if (value.length > discordUtil.getLimit('embed.author.name'))
                    throw new BBTagRuntimeError('Author name too long', value);
                embed.author = { ...embed.author, name: value };
                break;
            case 'author.url':
                if (!guard.isUrl(value))
                    throw new BBTagRuntimeError('Invalid author.url', value);
                embed.author = { name: '', ...embed.author, url: value };
                break;
            case 'author.icon_url':
                if (!guard.isUrl(value))
                    throw new BBTagRuntimeError('Invalid author.icon_url', value);
                embed.author = { name: '', ...embed.author, icon_url: value };
                break;
            case 'fields.name':
                if (embed.fields !== undefined && embed.fields.length >= discordUtil.getLimit('embed.fields'))
                    throw new BBTagRuntimeError('Too many fields', value);
                if (value.length > discordUtil.getLimit('embed.field.name'))
                    throw new BBTagRuntimeError('Field name too long', value);
                if (embed.fields === undefined)
                    embed.fields = [];
                embed.fields.push({
                    name: value
                });
                break;
            case 'fields.value':
                if (embed.fields === undefined || embed.fields.length === 0)
                    throw new BBTagRuntimeError('Field name not specified');
                if (value.length > discordUtil.getLimit('embed.field.value'))
                    throw new BBTagRuntimeError('Field value too long', value);
                embed.fields[embed.fields.length - 1].value = value;
                break;
            case 'fields.inline': {
                if (embed.fields === undefined || embed.fields.length === 0)
                    throw new BBTagRuntimeError('Field name not specified');
                const parsedValue = parse.boolean(value);
                if (typeof parsedValue !== 'boolean')
                    throw new BBTagRuntimeError('Inline must be a boolean', value);
                embed.fields[embed.fields.length - 1].inline = parsedValue;
                break;
            }
            default:
                throw new BBTagRuntimeError('Unknown key \'' + value + '\'');
        }

    }
}
