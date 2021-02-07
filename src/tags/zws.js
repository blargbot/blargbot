/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('zws')
        .withDesc('Will be replaced by a single zero width space (unicode 200B)')
        .withExample('{zws}', '\u200B')
        .whenArgs(0, async _ => '\u200B')
        .whenDefault(Builder.errors.tooManyArguments)
        .build();