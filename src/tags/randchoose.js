/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:11
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('randchoose')
        .acceptsArrays()
        .withArgs(a => a.require('choices', true))
        .withDesc('Picks a random entry that you provided. If an entry is an array, it will be chosen from one of the values in the array')
        .withExample(
            'I feel like eating {randchoose;cake;pie;pudding} today',
            'I feel like eating pudding today.'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenDefault(async function (params) {
            let options = await Builder.util.flattenArgArrays(params.args.splice(1)),
                selection = bu.getRandomInt(0, options.length - 1);

            return options[selection];
        })
        .build();