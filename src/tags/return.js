/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('return')
        .withArgs(a => a.optional('force'))
        .withDesc('Stops execution of the tag and returns what has been parsed. ' +
            'If `force` is `true` then it will also return from any tags calling this tag. ' +
            '`force` defaults to `true`')
        .withExample(
            'This will display. {return} This will not.',
            'This will display.'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', async function (params) {
            let force = bu.parseBoolean(params.args[1], true);
            return {
                terminate: force ? -1 : 1
            };
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();