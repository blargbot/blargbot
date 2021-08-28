import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';
import { EmbedFieldData, MessageEmbedOptions } from 'discord.js';

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
type EmbedBuildOptions = Overwrite<MessageEmbedOptions, { fields?: Array<Partial<EmbedFieldData>>;}>

export class EmbedBuildSubag extends BaseSubtag {
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
                    execute: (ctx, args, subtag) => this.buildEmbed(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public buildEmbed(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): string {
        const embed: EmbedBuildOptions = {};

        for (const entry of args) {
            if (entry.trim() === '')
                continue;
            const splitAt = entry.indexOf(':');
            if (splitAt === -1)
                return this.invalidEmbed('Missing \':\'', context, subtag);

            const key = entry.substring(0, splitAt);
            const value = entry.substring(splitAt + 1);

            const embedError = this.setField(embed, key, value);

            if (typeof embedError === 'string')
                return this.invalidEmbed(embedError, context, subtag);
        }

        if (embed.fields !== undefined) {
            if (embed.fields.filter(f => typeof f.value !== 'string' || f.value.trim() === '').length > 0)
                return this.invalidEmbed('Fields missing value', context, subtag);
            if (embed.fields.filter(f => typeof f.name !== 'string' || f.name.trim() === '').length > 0)
                return this.invalidEmbed('Field missing name', context, subtag);
        }
        const embedText = JSON.stringify(embed);
        if (embedText.length > 6000) //? Is this even how discord counts this?
            return this.invalidEmbed('Embed too long', context, subtag);
        return embedText;
    }

    private setField(
        embed: EmbedBuildOptions,
        key: string,
        value: string
    ): string | void {
        switch (key.toLowerCase()) {
            case 'title':
                if (value.length > 256)
                    return 'Title too long';
                embed.title = value;
                break;
            case 'description':
                if (value.length > 2048)
                    return 'Description too long';
                embed.description = value;
                break;
            case 'url':
                try {
                    const parsedValue = new URL(value);
                    embed.url = parsedValue.host;
                    break;
                } catch (e: unknown) {
                    return 'Invalid url';
                }
            case 'color': {
                const colour = parse.color(value);
                if (colour === undefined)
                    return 'Invalid color';
                embed.color = colour;
                break;
            }
            case 'timestamp': {
                const time = parse.time(value);
                if (!time.isValid())
                    return 'Invalid timestamp';
                embed.timestamp = time.toDate();
                break;
            }
            case 'footer.icon_url':
                try {
                    embed.footer = {...embed.footer, icon_url: new URL(value).href};
                    break;
                } catch (e: unknown) {
                    return 'Invalid footer.icon_url';
                }
            case 'footer.text':
                if (value.length > 2048)
                    return 'Footer text too long';
                embed.footer = {...embed.footer, text: value};
                break;
            case 'thumbnail.url':
                try {
                    embed.thumbnail = {...embed.thumbnail, url: new URL(value).href};
                    break;
                } catch (e: unknown) {
                    return 'Invalid thumbnail.url';
                }
            case 'image.url':
                try {
                    embed.image = {...embed.image, url: new URL(value).href};
                    break;
                } catch (e: unknown) {
                    return 'Invalid image.url';
                }
            case 'author.name':
                if (value.length > 256)
                    return 'Author name too long';
                embed.author = {...embed.author, name: value};
                break;
            case 'author.url':
                try {
                    embed.author = {...embed.author, url: new URL(value).href};
                    break;
                } catch (e: unknown) {
                    return 'Invalid author.url';
                }
            case 'author.icon_url':
                try {
                    embed.author = {...embed.author, icon_url: new URL(value).href};
                    break;
                } catch (e: unknown) {
                    return 'Invalid author.icon_url';
                }
            case 'fields.name':
                if (embed.fields !== undefined && embed.fields.length >= 25)
                    return 'Too many fields';
                if (value.length > 256)
                    return 'Field name too long';
                if (embed.fields === undefined)
                    embed.fields = [];
                embed.fields.push({
                    name: value
                });
                break;
            case 'fields.value':
                if (embed.fields === undefined || embed.fields.length === 0)
                    return 'Field name not specified';
                if (value.length > 1024)
                    return 'Field value too long';
                embed.fields[embed.fields.length - 1].value = value;
                break;
            case 'fields.inline': {
                if (embed.fields === undefined || embed.fields.length === 0)
                    return 'Field name not specified';
                const parsedValue = parse.boolean(value);
                if (typeof parsedValue !== 'boolean')
                    return 'Inline must be a boolean';
                embed.fields[embed.fields.length - 1].inline = parsedValue;
                break;
            }
            default:
                return 'Unknown key \'' + value + '\'';
        }

    }
}
