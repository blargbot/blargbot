/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('return')
        .withDesc('Stops execution of the tag and returns what has been parsed.')
        .withExample(
            'This will display. {return} This will not.',
            'This will display.'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', async function(params){
            return {
                terminate: true
            };
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();