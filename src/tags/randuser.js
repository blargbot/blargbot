/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:30
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('randuser')
        .withDesc('Returns the id of a random user on the current guild.')
        .withExample(
            '{username;{randuser}} is a lovely person! {username;{randuser}} isn\'t as good.',
            'abalabahaha is a lovely person! stupid cat isn\'t as good.'
        )
        .whenArgs(0, async function (subtag, context) {
            await bu.ensureMembers(context.guild);
            let members = context.guild.members.map(m => m);
            return members[bu.getRandomInt(0, members.length - 1)].user.id;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();