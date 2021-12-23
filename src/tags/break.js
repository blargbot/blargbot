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
    Builder.AutoTag('break')
        .withArgs(a => [])
        .withDesc('Breaks the currently running loop, regardless of its progress.')
        .withExample(
            '{unindent;{for;~i;0;<;10;\n    {get;~i}\n    {if;{get;~i};>;3;{break}}\n}}',
            '0\n1\n2\n3\n4'
        )
        .whenArgs('0', async function (subtag, context) {
            context.state.flowState = FlowState.BREAK_LOOP;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();