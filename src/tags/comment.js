/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:30:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:30:45
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
        ).whenDefault(async params => '')
        .build();