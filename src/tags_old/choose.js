/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-03 19:39:05
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('choose')
        .withArgs(a => [a.require('choice'), a.require('options', true)])
        .withDesc('Chooses from the given `options`, where `choice` is the index of the option to select.')
        .withExample(
            'I feel like eating {choose;1;cake;pie;pudding} today.',
            'I feel like eating pie today.'
        ).resolveArgs(0)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let index = bu.parseInt(args[0]);

            if (isNaN(index))
                return Builder.errors.notANumber(subtag, context);

            if (index < 0)
                return Builder.util.error(subtag, context, 'Choice cannot be negative');

            return await this.executeArg(subtag, args[index + 1], context);
        })
        .build();