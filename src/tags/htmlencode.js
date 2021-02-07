/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-25 09:03:43
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

module.exports =
    Builder.AutoTag('htmlencode')
        .withArgs(a => a.required('text'))
        .withDesc('Encodes `text` with escaped html entities.')
        .withExample(
            '{htmlencode;<hello, world>}',
            '&lt;hello, world&gt;'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            return entities.encode(args[0]);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();