/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('output')
        .withArgs(a => a.optional('text'))
        .withDesc('WIP')
        .withExample(
            '{output;Hello!}',
            'Hello!'
        )
        .whenArgs('0-1', async function (_, context, args) {
            return await context.sendOutput(args[0]);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();