/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:11
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-19 22:59:32
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('randchoose')
        .acceptsArrays()
        .withArgs(a => a.require('choices', true))
        .withDesc('Picks one random entry from `choices`. If an array is supplied, it will be exapnded to its individual elements')
        .withExample(
            'I feel like eating {randchoose;cake;pie;pudding} today',
            'I feel like eating pudding today.'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let options = Builder.util.flattenArgArrays(params.args.splice(1)),
                selection = bu.getRandomInt(0, options.length - 1);

            params.content = options[selection];
            return await bu.processTagInner(subtag, context, args);
        })
        .build();