import { BBTagRuntimeError, NotANumberError, Subtag } from '@bbtag/blargbot';
import { GetSubtag } from '@bbtag/blargbot/subtags';
import { TagVariableType } from '@blargbot/domain/models/index.js';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(GetSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...generateTestCases(false, 'testTag', [
            { args: ['myVariableName'], key: { scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'myVariableName' }, value: 'LOCAL_TAG value', expected: 'LOCAL_TAG value' },
            { args: ['~myVariableName'], key: undefined, value: undefined, expected: '' },
            { args: ['*myVariableName'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: 'GLOBAL value', expected: 'GLOBAL value' },
            { args: ['@myVariableName'], key: { scope: { type: TagVariableType.AUTHOR, authorId: '823764823946284623234' }, name: 'myVariableName' }, value: 'AUTHOR value', expected: 'AUTHOR value' },
            { args: ['_myVariableName'], key: { scope: { type: TagVariableType.GUILD_TAG, guildId: '23904768237436873424' }, name: 'myVariableName' }, value: 'GUILD_TAG value', expected: 'GUILD_TAG value' },
            { args: ['myVariableName'], key: { scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'myVariableName' }, value: 'LOCAL_TAG value', expected: 'LOCAL_TAG value' },
            { args: ['*myVariableName'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: '{"v":["a","b","c"],"n":"*myVariableName"}' },
            { args: ['*myVariableName', '0'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'a' },
            { args: ['*myVariableName', '1'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'b' },
            { args: ['*myVariableName', '2'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'c' },
            { args: ['*myVariableName', '2'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' },
            { args: ['*myVariableName', 'abc'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' }
        ]),
        ...generateTestCases(true, 'testTag', [
            { args: ['myVariableName'], key: { scope: { type: TagVariableType.LOCAL_CC, guildId: '23904768237436873424', name: 'testTag' }, name: 'myVariableName' }, value: 'LOCAL_CC value', expected: 'LOCAL_CC value' },
            { args: ['~myVariableName'], key: undefined, value: undefined, expected: '' },
            { args: ['*myVariableName'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: 'GLOBAL value', expected: 'GLOBAL value' },
            { args: ['@myVariableName'], key: { scope: { type: TagVariableType.AUTHOR, authorId: '823764823946284623234' }, name: 'myVariableName' }, value: 'AUTHOR value', expected: 'AUTHOR value' },
            { args: ['_myVariableName'], key: { scope: { type: TagVariableType.GUILD_CC, guildId: '23904768237436873424' }, name: 'myVariableName' }, value: 'GUILD_CC value', expected: 'GUILD_CC value' },
            { args: ['*myVariableName'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: '{"v":["a","b","c"],"n":"*myVariableName"}' },
            { args: ['*myVariableName', '0'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'a' },
            { args: ['*myVariableName', '1'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'b' },
            { args: ['*myVariableName', '2'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'c' },
            { args: ['*myVariableName', '2'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' },
            { args: ['*myVariableName', 'abc'], key: { scope: { type: TagVariableType.GLOBAL }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' }
        ]),
        {
            code: '{get;*myVariableName;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 25, error: new NotANumberError('abc') }
            ],
            async postSetup(ctx) {
                await ctx.variables.set('*myVariableName', [1, 2, 3]);
            }
        },
        {
            code: '{get;*myVariableName;4}',
            expected: '`Index out of range`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Index out of range') }
            ],
            async postSetup(ctx) {
                await ctx.variables.set('*myVariableName', [1, 2, 3]);
            }
        },
        {
            code: '{get;*myVariableName;-1}',
            expected: '`Index out of range`',
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Index out of range') }
            ],
            async postSetup(ctx) {
                await ctx.variables.set('*myVariableName', [1, 2, 3]);
            }
        }
    ]
});

function* generateTestCases(isCC: boolean, tagName: string, cases: Array<{ args: string[]; key: Parameters<SubtagTestContext['tagVariables']['get']>[0] | undefined; value: JToken | undefined; expected: string; }>): Generator<SubtagTestCase> {
    for (const { args, key, value, expected } of cases) {
        const title = isCC ? 'Custom command' : 'Tag';
        const code = `{${['get', ...args].join(';')}}`;
        yield {
            title: `From DB and ${title}`,
            code: code,
            expected,
            setup(ctx) {
                ctx.guild.id = '23904768237436873424';
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.users.command.id = '823764823946284623234';
                ctx.options.isCC = isCC;
                ctx.options.tagName = tagName;
                if (key !== undefined) {
                    if (value === undefined)
                        ctx.tagVariables.delete(key);
                    else
                        ctx.tagVariables.set(key, value);
                }
            }
        };
        yield {
            title: `From cache and ${title}`,
            code: code,
            expected,
            setup(ctx) {
                ctx.guild.id = '23904768237436873424';
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.users.command.id = '823764823946284623234';
                ctx.options.isCC = isCC;
                ctx.options.tagName = tagName;
            },
            async postSetup(bbctx) {
                await bbctx.variables.set(args[0], value);
            }
        };
        yield {
            title: `Ignoring cache and ${title}`,
            code: `{${['get', `!${args[0]}`, ...args.slice(1)].join(';')}}`,
            expected,
            setup(ctx) {
                ctx.guild.id = '23904768237436873424';
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.users.command.id = '823764823946284623234';
                ctx.options.isCC = isCC;
                ctx.options.tagName = tagName;
                if (key !== undefined) {
                    if (value === undefined)
                        ctx.tagVariables.delete(key);
                    else
                        ctx.tagVariables.set(key, value);
                }
            },
            async postSetup(bbctx) {
                await bbctx.variables.set(args[0], 'FAIL');
            }
        };
    }
}
