/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:15
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-08-30 14:19:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('guildbans')
        .withDesc('Returns an array of banned users on the current guild.')
        .withExample(
        'This guild has {length;{guildbans}} banned users.',
        'This guild has 123 banned users.'
        )
        .whenArgs(0, async (subtag, context) => {
            try {
                return JSON.stringify((await context.guild.getBans()).map(u => u.user.id));
            } catch (err) {
                return Builder.errors.missingPermissions(subtag, context);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();