/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-25 09:05:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

module.exports =
    Builder.AutoTag('htmldecode')
        .withArgs(a => a.require('text'))
        .withDesc('Decodes html entities from `text`.')
        .withExample(
        '{htmldecode;&lt;hello, world&gt;}',
        '<hello, world>'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            return entities.decode(args.join(';'));
        })
        .build();