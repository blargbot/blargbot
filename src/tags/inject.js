/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:48:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:48:30
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    exec = require('./exec');

module.exports =
    Builder.BotTag('inject')
        .withArgs(a => a.required('code'))
        .withDesc('Executes any arbitrary BBTag that is within `code` and returns the result. Useful for making dynamic code, or as a testing tool (`{inject;{args}}`)')
        .withExample(
            'Random Number: {inject;{lb}randint{semi}1{semi}4{lb}}',
            'Random Number: 3'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async (subtag, context, args) => await exec.execTag(subtag, context, args[0], undefined))
        .whenDefault(Builder.errors.tooManyArguments)
        .build();