/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('output')
        .withArgs(a => a.optional('text'))
        .withDesc('Forces an early send of the default output message, using `text` as the text to show. ' +
            'If this is used then there will be no output sent once the tag finishes. Only 1 `{output}` may be used per ' +
            'tag/cc. If a second `{output}` is used then the result of the first `{output}` will be returned instead.' +
            '\nThe message id of the output that was sent will be returned.')
        .withExample(
            '{output;Hello!}',
            'Hello!'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            if (context.state.timerCount == -1)
                return Builder.util.error(subtag, context, '{output} is disabled inside timers.');
            if (context.state.outputMessage && args[0])
                return Builder.util.error(subtag, context, 'Cannot send multiple outputs');
            return await context.sendOutput(args[0]);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();