/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:21:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:21:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('void')
        .withAlias('null')
        .withArgs(a => a.optional('code'))
        .withDesc('Executes `code` but does not return the output from it. Useful for silent functionality')
        .withExample(
            '{void;This won\'t be output!}',
            ''
        )
        .whenDefault(async _ => '')
        .build();