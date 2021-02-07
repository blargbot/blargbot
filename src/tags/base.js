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
        .withAlias('radix')
        .withArgs(a => [
            a.required('integer'),
            a.optional('origin'),
            a.required('radix')
        ]).withDesc('Converts a Base `origin` `integer` into a base `radix` number. Default `origin` is 10. `radix` must be between 2 and 36.')
        .withExample(
            '{base;255;16}',
            'FF'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            if (args.length === 2)
                args.splice(1, 0, '10');

            let fallback = bu.parseInt(context.scope.fallback),
                origin = bu.parseInt(args[1]),
                radix = bu.parseInt(args[2]);

            let radixFallback = !isNaN(fallback) && bu.between(fallback, 2, 36, true);

            if (isNaN(origin) && radixFallback) origin = fallback;
            if (isNaN(radix) && radixFallback) radix = fallback;

            if (isNaN(origin) || isNaN(radix))
                return Builder.errors.notANumber(subtag, context);

            //This check is needed because js cant natively handle radixes over 36 (0-9, a-z)
            if (!bu.between(origin, 2, 36, true) && radixFallback) origin = fallback;
            if (!bu.between(radix, 2, 36, true) && radixFallback) radix = fallback;

            if (!bu.between(origin, 2, 36, true) || !bu.between(radix, 2, 36, true))
                return Builder.util.error(subtag, context, 'Base must be between 2 and 36');

            let value = bu.parseInt(args[0], origin);
            if (isNaN(value)) {
                if (!isNaN(fallback))
                    value = fallback;
                else
                    return Builder.errors.notANumber(subtag, context);
            }
            return value.toString(radix);

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();