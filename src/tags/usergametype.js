/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:02
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:17:32
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    gameTypes = {
        default: '',
        0: 'playing',
        1: 'streaming'
    };

module.exports =
    Builder.AutoTag('usergametype')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns how `user` is playing the game (playing, streaming). ' +
        '`user` defaults to the user who executed the containing tag. ' +
        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
        'You are {usergametype} right now!',
        'You are playing right now!'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = context.user;

            if (args[0])
                user = await bu.getUser(context.msg, args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null)
                return gameTypes[user.game || { type: -1 }] || gameTypes.default;

            if (quiet)
                return args[0];
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();