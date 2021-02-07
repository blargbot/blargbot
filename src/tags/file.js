/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-06 17:38:25
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('file')
        .withArgs(a => [a.require('file'), a.require('filename')])
        .withDesc('Sets the output attachment to the provided `file` and `filename`. If `file` starts with `buffer:`, the following text will be parsed as base64 to a raw buffer - useful for uploading images.')
        .withExample(
            '{file;Hello, world!;readme.txt}',
            '(a file labeled readme.txt containing "Hello, world!")'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let file = context.state.file = { file: args[0], name: args[1] };
            if (file.file.startsWith('buffer:'))
                file.file = Buffer.from(file.file.substring(7), 'base64');
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();