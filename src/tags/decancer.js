/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:19:26
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:19:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('decancer')
        .withArgs(a => a.require('text'))
        .withDesc('Returns the decancered version of `text`.')
        .withExample(
            '{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}',
            'haha im so edgy'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            return bu.decancer(args[0]);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();