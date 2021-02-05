/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:35
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:51:35
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('rb')
        .withDesc('Will be replaced by `}` on execution.')
        .withExample(
            'This is a bracket! {rb}',
            'This is a bracket! }'
        )
        .whenArgs(0, async _ => '}')
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
