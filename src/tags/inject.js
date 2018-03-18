/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:48:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:48:30
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ComplexTag('inject')
        .withArgs(a => a.require('code'))
        .withDesc('Executes any arbitrary BBTag that is within `code` and returns the result. Useful for making dynamic code, or as a testing tool (`{inject;{args}}`)')
        .withExample(
            'Random Number: {inject;{lb}randint{semi}1{semi}4{lb}}',
            'Random Number: 3'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            params.content = bu.processSpecial(params.args[1], true);
            let result = await bu.processTag(params);
            if (result.terminate) result.terminate--;
            return result;
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();