/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('guildownerid')
        .withDesc('Returns the id of the guild\'s owner.')
        .withExample(
            'The owner\'s id is {guildownerid}.',
            'The owner\'s id is 1234567890123456.'
        )
        .whenArgs(0, async (_, context) => context.guild.ownerID)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();