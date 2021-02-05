/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('messageid')
        .withDesc('Returns the ID of the invoking message.')
        .withExample(
            'The message id was {messageid}',
            'The message id was 111111111111111111'
        )
        .whenArgs(0, async (_, context) => context.msg.id)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();