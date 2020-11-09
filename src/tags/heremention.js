/**
 * @Author: RagingLink
 * @Date: 2020-05-26 11:32:51
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-05-26 11:40:57
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
*/

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('heremention')
        .withAlias('here')
        .withDesc(
            'Returns the mention of `@here`.\nThis requires the `disableeveryone` setting to be false.'
        )
        .withExample(
            '{heremention}',
            '@here'
        )
        .whenArgs('0', async function (subtag, context, args) {
            let enabled = bu.parseBoolean(args[0], true);
            context.state.allowedMentions.everybody = enabled;

            return "@here";
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
