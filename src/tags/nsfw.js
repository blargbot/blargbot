/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('nsfw')
        .withDesc('Marks the message is being NSFW, and only to be outputted in NSFW channels. A requirement for any tag with NSFW content.')
        .withExample(
            'This command is not safe! {nsfw}',
            'This command is not safe!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', async function (params) { })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();