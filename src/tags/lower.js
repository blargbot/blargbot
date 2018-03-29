/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('lower')
        .withArgs(a => a.require('text'))
        .withDesc('Returns `text` as lowercase.')
        .withExample(
            '{lower;THIS WILL BECOME LOWERCASE}',
            'this will become lowercase'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async (_, __, args) => (args[0] || '').toLowerCase())
        .whenDefault(Builder.errors.tooManyArguments)
        .build();