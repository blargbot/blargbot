/*
 * @Author: stupid cat
 * @Date: 2018-02-07 18:30:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-02-24 15:16:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('subtagexists')
        .withArgs(a => a.required('subTag'))
        .withDesc('Checks to see if `subTag` exists.')
        .withExample(
            '{subtagexists;ban} {subtagexists;AllenKey}',
            'true false'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async (_, context, args) => TagManager.list[args[0].toLowerCase()] != null)
        .whenDefault(Builder.errors.tooManyArguments)
        .build();