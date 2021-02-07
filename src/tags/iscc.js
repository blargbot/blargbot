/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 09:46:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('iscc')
        .withDesc('Checks if the tag is being run from within a cc. Returns a boolean (`true` or `false`)')
        .withExample(
        '{if;{iscc};{dm;{userid};You have mail!};Boo, this only works in cc\'s}',
        'Boo, this only works in cc\'s'
        )
        .whenArgs(0, async (_, context) => context.isCC === true)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();