/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-16 11:52:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('apply')
        .withArgs(a => [a.require('subtag'), a.optional('args', true)])
        .withDesc('Executes the provided subtag, using the `args` as parameters. ' +
            'If `args` is an array, it will get deconstructed to it\'s individual elements.'
        ).withExample(
            '{apply;randint;[1,4]}',
            '3'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenDefault(async function(params) {
            if (!TagManager.list.hasOwnProperty(params.args[1]))
                return await Builder.util.error(params, 'No tag found');
            let tag = TagManager.list[params.args[1]];
            let tagArgs = Builder.util.flattenArgArrays(params.args.slice(2));

            params.args = [params.args[0], ...tagArgs];

            return await tag.execute(params);
        })
        .build();