/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('base')
        .withArgs(a => [
            a.require('integer'),
            a.optional('origin'),
            a.require('radix')
        ]).withDesc('Converts a Base `origin` `integer` into a base `radix` number. Default `origin` is 10. `radix` must be between 2 and 36.')
        .withExample(
            '{base;255;16}',
            'FF'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (params) {
            let args = params.args.slice(1);
            if (args.length === 2)
                args.splice(1, 0, '10');

            let fallback = bu.parseInt(params.fallback),
                origin = bu.parseInt(args[1]),
                radix = bu.parseInt(args[2]);

            let radixFallback = !isNaN(fallback) && bu.between(fallback, 2, 36, true);

            if (isNaN(origin) && radixFallback) origin = fallback;
            if (isNaN(radix) && radixFallback) radix = fallback;

            if (isNaN(origin) || isNaN(radix))
                return await Builder.errors.notANumber(params);

            //This check is needed because js cant natively handle radixes over 36 (0-9, a-z)
            if (!bu.between(origin, 2, 36, true) && radixFallback) origin = fallback;
            if (!bu.between(radix, 2, 36, true) && radixFallback) radix = fallback;

            if (!bu.between(origin, 2, 36, true) || !bu.between(radix, 2, 36, true))
                return await Builder.util.error(params, 'Base must be between 2 and 36');

            let value = bu.parseInt(args[0], origin);
            if (isNaN(value)) {
                if (!isNaN(fallback))
                    value = fallback;
                else
                    return await Builder.errors.notANumber(params);
            }
            return value.toString(radix);

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();