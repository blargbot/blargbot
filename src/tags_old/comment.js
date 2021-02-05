/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-31 14:07:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('//')
        .withArgs(a => a.literal('anything'))
        .withDesc('A subtag that just gets removed. Useful for documenting your code.')
        .withExample(
            'This is a sentence. {//;This is a comment.}',
            'This is a sentence.'
        ).whenDefault(async _ => '')
        .resolveArgs(-1)
        .build();