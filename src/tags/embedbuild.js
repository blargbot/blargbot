/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const url = require('url');
const { parse } = require('../newbu');

const fields = [
    {
        key: 'title',
        error: (e, v) => v.length > 256
            ? 'Title too long'
            : false,
        parse: v => v,
        setter: (e, v) => e.title = v
    },
    {
        key: 'description',
        error: (e, v) => v.length > 2048
            ? 'Description too long'
            : false,
        parse: v => v,
        setter: (e, v) => e.description = v
    },
    {
        key: 'url',
        error: (e, v) => v.host == null
            ? 'Invalid url'
            : false,
        parse: v => url.parse(v),
        setter: (e, v) => e.url = v.href
    },
    {
        key: 'color',
        desc: 'can be a [HTML color](https://www.w3schools.com/colors/colors_names.asp), hex, (r,g,b) or a valid color number.',
        error: (e, v) => v == null
            ? 'Invalid color'
            : false,
        parse: parse.color,
        setter: (e, v) => e.color = v
    },
    {
        key: 'timestamp',
        error: (e, v) => typeof v == 'string'
            ? v
            : !v.isValid()
                ? 'Invalid timestamp'
                : false,
        parse: parse.time,
        setter: (e, v) => e.timestamp = v
    },
    {
        key: 'footer.icon_url',
        error: (e, v) => v.host == null
            ? 'Invalid footer.icon_url'
            : false,
        parse: v => url.parse(v),
        setter: (e, v) => getObj(e, 'footer').icon_url = v.href
    },
    {
        key: 'footer.text',
        error: (e, v) => v.length > 2048
            ? 'Footer text too long'
            : false,
        parse: v => v,
        setter: (e, v) => getObj(e, 'footer').text = v
    },
    {
        key: 'thumbnail.url',
        error: (e, v) => v.host == null
            ? 'Invalid thumbnail.url'
            : false,
        parse: v => url.parse(v),
        setter: (e, v) => getObj(e, 'thumbnail').url = v.href
    },
    {
        key: 'image.url',
        error: (e, v) => v.host == null
            ? 'Invalid image.url'
            : false,
        parse: v => url.parse(v),
        setter: (e, v) => getObj(e, 'image').url = v.href
    },
    {
        key: 'author.name',
        error: (e, v) => v.length > 256
            ? 'Author name too long'
            : false,
        parse: v => v,
        setter: (e, v) => getObj(e, 'author').name = v
    },
    {
        key: 'author.url',
        error: (e, v) => v.host == null
            ? 'Invalid author.url'
            : false,
        parse: v => url.parse(v),
        setter: (e, v) => getObj(e, 'author').url = v.href
    },
    {
        key: 'author.icon_url',
        error: (e, v) => v.host == null
            ? 'Invalid author.icon_url'
            : false,
        parse: v => url.parse(v),
        setter: (e, v) => getObj(e, 'author').icon_url = v.href
    },
    {
        key: 'fields.name',
        desc: 'Must have `fields.value` after. Cannot be empty.',
        error: (e, v) => getObj(e, 'fields', []).length >= 25
            ? 'Too many fields'
            : v.length > 256
                ? 'Field name too long' :
                false,
        parse: v => v,
        setter: (e, v) => lastElem(getObj(e, 'fields', []), true).name = v
    },
    {
        key: 'fields.value',
        desc: 'Must come after a `fields.name`. Cannot be empty',
        error: (e, v) => getObj(e, 'fields', []).length == 0
            ? 'Field name not specified'
            : v.length > 1024
                ? 'Field value too long' :
                false,
        parse: v => v,
        setter: (e, v) => lastElem(getObj(e, 'fields', [])).value = v
    },
    {
        key: 'fields.inline',
        desc: 'Must come after a `fields.name`',
        error: (e, v) => getObj(e, 'fields', []).length == 0
            ? 'Field name not specified'
            : typeof v !== 'boolean'
                ? 'Inline must be a boolean'
                : false,
        parse: parse.boolean,
        setter: (e, v) => lastElem(getObj(e, 'fields', [])).inline = v
    }
];

function getObj(embed, objName, defVal) {
    if (embed[objName])
        return embed[objName];
    embed[objName] = defVal || {};
    return embed[objName];
}

function lastElem(array, addNew = false) {
    if (addNew)
        array.push({});

    return array[array.length - 1];
}

module.exports =
    Builder.AutoTag('embedbuild')
        .withAlias('buildembed')
        .withArgs(a => a.require('values',
            true))
        .withDesc('This tag is designed to allow you to generate embed code for `{webhook}` and `{embed}` with much less effort.\n' +
            'This tag uses a key/value system, with each entry in `values` looking like `key:value`.\n\n' +
            'Valid keys are:\n' + fields.map(k => '`' + k.key + '`' + (k.desc == null ? '' : ' - ' + k.desc)).join('\n') + '\n\n' +
            'You can find information about embeds [here (embed structure)](https://discordapp.com/developers/docs/resources/channel#embed-object) ' +
            'and [here (embed limits)](https://discordapp.com/developers/docs/resources/channel#embed-limits) as well as a useful tool for testing embeds ' +
            '[here](https://leovoel.github.io/embed-visualizer/)')
        .withExample(
            '{embedbuild;\n  title:hello!;\n  description:I am an example embed;\n  fields.name:Field 1;\n  fields.value:This is the first field!;\n  ' +
            'fields.name:Field 2;\n  fields.value:This is the next field and is inline!;\n  fields.inline:true\n}',
            '{"title":"hello!","description":"I am an example embed","fields":[' +
            '{"name":"Field 1","value":"This is the first field!"},' +
            '{"name":"Field 2","value":"This is the next field and is inline!","inline":true}]}'
        )
        .whenArgs(0,
            Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let embed = {};
            for (let i = 0; i < args.length; i++) {
                const entry = args[i];
                if (entry.trim() == '')
                    continue;
                let splitAt = entry.indexOf(':');

                if (splitAt == -1) return Builder.errors.invalidEmbed(subtag.children[i], context, 'Missing \':\'');

                let key = entry.substring(0, splitAt),
                    value = entry.substring(splitAt + 1),
                    field = fields.filter(f => f.key == key.trim().toLowerCase())[0];

                if (field == null) return Builder.errors.invalidEmbed(subtag.children[i], context, 'Unknown key \'' + key + '\'');

                value = field.parse(value.trim());
                let error = field.error(embed, value);
                if (error != false)
                    return Builder.errors.invalidEmbed(subtag.children[i], context, error);
                field.setter(embed, value);
            }

            if (embed.fields) {
                if (embed.fields.filter(f => !(f.value || '').trim()).length > 0)
                    return Builder.errors.invalidEmbed(subtag, context, 'Field missing value');
                if (embed.fields.filter(f => !(f.name || '').trim()).length > 0)
                    return Builder.errors.invalidEmbed(subtag, context, 'Field missing name');
            }

            let embedText = JSON.stringify(embed);
            if (embedText.length > 6000)
                return Builder.errors.invalidEmbed(subtag, context, 'Embed too long');

            return embedText;
        })
        .build();