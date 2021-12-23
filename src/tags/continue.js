/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { FlowState } = require('../structures/bbtag/FlowControl');
const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('continue')
        .withArgs(a => [])
        .withDesc('Skips to the next loop, regardless of its progress.')
        .withExample(
            '{unindent;{for;~i;0;<;10;\n    {if;{math;%;{get;~i};3};==;1;{continue}}\n    {get;~i}\n}}',
            '0\n2\n3\n5\n6\n8\n9'
        )
        .whenArgs('0', async function (subtag, context) {
            context.state.flowState = FlowState.CONTINUE_LOOP;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();