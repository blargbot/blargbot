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
        .withArgs(a => a.required('choices', true))
        .withDesc('Picks one random entry from `choices`. If an array is supplied, it will be exapnded to its individual elements')
        .withExample(
            'I feel like eating {randchoose;cake;pie;pudding} today',
            'I feel like eating pudding today.'
        ).resolveArgs(-1)
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let value = await this.executeArg(subtag, args[0], context);
            let options = await bu.getArray(context, value);
            if (options == null || !Array.isArray(options.v))
                return value;
            let selection = bu.getRandomInt(0, options.v.length - 1);
            return options.v[selection];
        })
        .whenDefault(async function (subtag, context, args) {
            let selection = bu.getRandomInt(0, args.length - 1);
            return await this.executeArg(subtag, args[selection], context);
        })
        .build();
