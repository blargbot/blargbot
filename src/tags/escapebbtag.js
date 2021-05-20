/**
 * @Author: RagingLink 
 * @Date: 2020-06-25 12:25:05
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-05-21 00:05:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('escapebbtag')
        .withArgs(a => [a.require('code')])
        .withAlias('escape')
        .withDesc('Returns `code` without executing any BBtag inside it.\n' +
            'This effectively returns the characters `{`,`}` and `;` as is, without the use of `{rb}`, `{lb}` and `{semi}`.\n' +
            '**NOTE**: Brackets inside `code` must come in pairs. A { *has to be* followed by a } somewhere and a } *has to have* a { before it')
        .withExample(
            '{escapebbtag;{set;~index;1}}',
            '{set;~index;1}'
        )
        .resolveArgs(-1)
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async (subtag, context, args) => {
            return args.map(arg => arg.content).join(';');
        })
        .build();