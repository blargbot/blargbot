/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-16 11:52:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    exec = require('./exec');

module.exports =
    Builder.ArrayTag('apply')
        .withArgs(a => [a.require('subtag'), a.optional('args', true)])
        .withDesc('Executes `subtag`, using the `args` as parameters. ' +
            'If `args` is an array, it will get deconstructed to it\'s individual elements.'
        ).withExample(
            '{apply;randint;[1,4]}',
            '3'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let definition = TagManager.get(args[0].toLowerCase());
            if (!definition == null)
                return Builder.util.error(subtag, context, 'No subtag found');

            let tagArgs = Builder.util.flattenArgArrays(args.slice(1));
            let code = '{' + [args[0], ...tagArgs].join(';') + '}';

            return exec.execTag(definition.name, context, code, undefined);
        })
        .build();
