/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { FlowState } = require('../structures/bbtag/FlowControl');
const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('return')
        .withArgs(a => [a.optional('force'), a.optional('content')])
        .withDesc('Stops execution of the tag and returns what has been parsed. ' +
            'If `content` is given, then that will be used as the result of the current tag rather than the normal result. ' +
            'If `force` is `true` then it will also return from any tags calling this tag. ' +
            '`force` defaults to `true`')
        .withExample(
            'This will display. {return} This will not.',
            'This will display.'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            if (bu.parseBoolean(args[0], true)) {
                context.state.flowState = FlowState.KILL_ALL;
                context.state.tagResults[0] = args[1];
            } else {
                context.state.flowState = FlowState.KILL_TAG;
                context.state.tagResults[context.state.tagResults.length - 1] = args[1];
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();