/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
  fields = [
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
      error: () => false,
      parse: v => v,
      setter: (e, v) => e.url = v
    },
    {
      key: 'color',
      error: (e, v) => v == null
        ? 'Invalid color'
        : false,
      parse: bu.parseColor,
      setter: (e, v) => e.color = v
    },
    {
      key: 'timestamp',
      error: () => false,
      parse: v => dep.moment(v),
      setter: (e, v) => e.timestamp = v
    },
    {
      key: 'footer.icon_url',
      error: () => false,
      parse: v => v,
      setter: (e, v) => getObj(e, 'footer').icon_url = v
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
      error: () => false,
      parse: v => v,
      setter: (e, v) => getObj(e, 'thumbnail').url = v
    },
    {
      key: 'image.url',
      error: () => false,
      parse: v => v,
      setter: (e, v) => getObj(e, 'image').url = v
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
      error: () => false,
      parse: v => v,
      setter: (e, v) => getObj(e, 'author').url = v
    },
    {
      key: 'author.icon_url',
      error: () => false,
      parse: v => v,
      setter: (e, v) => getObj(e, 'author').icon_url = v
    },
    {
      key: 'fields.name',
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
      error: (e, v) => getObj(e, 'fields', []).length == 0
        ? 'Field name not specified'
        : !bu.isBoolean(v)
          ? 'Inline must be a boolean'
          : false,
      parse: bu.parseBoolean,
      setter: (e, v) => lastElem(getObj(e, 'fields', [])).inline = v
    },
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
  Builder.AutoTag('buildembed')
    .withArgs(a => a.require('values',
      true))
    .withDesc('This tag is designed to allow you to generate embed code for `{webhook}` and `{embed}` with much less effort.\n' +
      'This tag uses a key/value system, with each entry in `values` looking like `key:value`. ' +
      'Valid keys are:\n`' + fields.map(k => k.key).join('`\n`') + '`\n' +
      'For the `fields` related keys, `fields.name` must precede a `fields.value`')
    .withExample(
      '{buildembed;\n  title:hello!;\n  description:I am an example embed;\n  fields.name:Field 1;\n  fields.value:This is the first field!;\n  ' +
      'fields.name:Field 2;\n  fields.value:This is the next field and is inline!;\n  fields.inline:true\n}',
      '{"title":"hello!","description":"I am an example embed","fields":[' +
      '{"name":"Field 1","value":"This is the first field!"},' +
      '{"name":"Field 2","value":"This is the next field and is inline!","inline":true}]}'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1',
      Builder.errors.notEnoughArguments)
    .whenDefault(async function (params) {
      let embed = {};
      for (const entry of params.args.slice(1)) {
        let splitAt = entry.indexOf(':');

        if (splitAt == -1) return await Builder.errors.invalidEmbed(params, 'Missing \':\'');

        let key = entry.substring(0, splitAt),
          value = entry.substring(splitAt + 1),
          field = fields.filter(f => f.key == key.trim().toLowerCase())[0];

        if (field == null) return await Builder.errors.invalidEmbed(params, 'Unknown key \'' + key + '\'');

        value = field.parse(value.trim());
        let error = field.error(embed, value);
        if (error != false)
          return await Builder.errors.invalidEmbed(params, error);
        field.setter(embed, value);
      }

      if (embed.fields) {
        if (embed.fields.filter(f => !(f.value || '').trim()).length > 0)
          return await Builder.errors.invalidEmbed(params, 'Field missing value');
        if (embed.fields.filter(f => !(f.name || '').trim()).length > 0)
          return await Builder.errors.invalidEmbed(params, 'Field missing name');
      }

      let embedText = JSON.stringify(embed);
      if (embedText.length > 6000)
        return await Builder.errors.invalidEmbed(params, 'Embed too long');

      return embedText;
    })
    .build();