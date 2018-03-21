/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:06
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-12-15 15:03:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('repeat')
        .withArgs(a => [a.require('text'), a.require('amount')])
        .withDesc('Repeats `text` `amount` times. `text` will be interpreted as BBTag code')
        .withExample(
            '{repeat;e;10}',
            'eeeeeeeeee'
        ).resolveArgs(1)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (subtag, context, args) {
            let fallback = bu.parseInt(params.fallback),
                amount = bu.parseInt(await bu.processTagInner(params, 2)),
                result = '';

            if (isNaN(amount)) {
                if (isNaN(fallback))
                    return Builder.errors.notANumber(subtag, context);
                amount = fallback;
            }

            if (amount < 0) return Builder.util.error(subtag, context, 'Cant be negative');

            for (let i = 0; i < amount; i++) {
                params.msg.repeats = params.msg.repeats ? params.msg.repeats + 1 : 1;
                if (params.msg.repeats > 1500) {
                    result += Builder.errors.tooManyLoops(subtag, context);
                    break;
                }
                result += await bu.processTagInner(params, 1);
                if (params.terminate)
                    break;
            }
            return result;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();