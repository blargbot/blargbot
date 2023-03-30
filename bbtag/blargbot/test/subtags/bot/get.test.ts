import { BBTagRuntimeError, NotANumberError } from '@bbtag/blargbot';
import { GetSubtag } from '@bbtag/blargbot/subtags';

import type { SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: GetSubtag,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...generateTestCases(false, 'testTag', [
            { args: ['myVariableName'], key: { scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'myVariableName' }, value: 'LOCAL_TAG value', expected: 'LOCAL_TAG value' },
            { args: ['~myVariableName'], key: undefined, value: undefined, expected: '' },
            { args: ['*myVariableName'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: 'GLOBAL value', expected: 'GLOBAL value' },
            { args: ['@myVariableName'], key: { scope: { ownerId: 823764823946284623234n, scope: 'global' }, name: 'myVariableName' }, value: 'AUTHOR value', expected: 'AUTHOR value' },
            { args: ['_myVariableName'], key: { scope: { ownerId: 23904768237436873424n, scope: 'public:tag' }, name: 'myVariableName' }, value: 'GUILD_TAG value', expected: 'GUILD_TAG value' },
            { args: ['myVariableName'], key: { scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'myVariableName' }, value: 'LOCAL_TAG value', expected: 'LOCAL_TAG value' },
            { args: ['*myVariableName'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: '{"v":["a","b","c"],"n":"*myVariableName"}' },
            { args: ['*myVariableName', '0'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'a' },
            { args: ['*myVariableName', '1'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'b' },
            { args: ['*myVariableName', '2'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'c' },
            { args: ['*myVariableName', '2'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' },
            { args: ['*myVariableName', 'abc'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' }
        ]),
        ...generateTestCases(true, 'testTag', [
            { args: ['myVariableName'], key: { scope: { ownerId: 23904768237436873424n, scope: 'local:tag:testTag' }, name: 'myVariableName' }, value: 'LOCAL_CC value', expected: 'LOCAL_CC value' },
            { args: ['~myVariableName'], key: undefined, value: undefined, expected: '' },
            { args: ['*myVariableName'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: 'GLOBAL value', expected: 'GLOBAL value' },
            { args: ['@myVariableName'], key: { scope: { ownerId: 823764823946284623234n, scope: 'global' }, name: 'myVariableName' }, value: 'AUTHOR value', expected: 'AUTHOR value' },
            { args: ['_myVariableName'], key: { scope: { ownerId: 23904768237436873424n, scope: 'secret' }, name: 'myVariableName' }, value: 'GUILD_CC value', expected: 'GUILD_CC value' },
            { args: ['*myVariableName'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: '{"v":["a","b","c"],"n":"*myVariableName"}' },
            { args: ['*myVariableName', '0'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'a' },
            { args: ['*myVariableName', '1'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'b' },
            { args: ['*myVariableName', '2'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: ['a', 'b', 'c'], expected: 'c' },
            { args: ['*myVariableName', '2'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' },
            { args: ['*myVariableName', 'abc'], key: { scope: { ownerId: 0n, scope: 'global' }, name: 'myVariableName' }, value: 'This isnt an array', expected: 'This isnt an array' }
        ]),
        {
            code: '{get;*myVariableName;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 25, error: new NotANumberError('abc') }
            ],
            async postSetup(ctx) {
                await ctx.runtime.variables.set('*myVariableName', [1, 2, 3]);
            }
        },
        {
            code: '{get;*myVariableName;4}',
            expected: '`Index out of range`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Index out of range') }
            ],
            async postSetup(ctx) {
                await ctx.runtime.variables.set('*myVariableName', [1, 2, 3]);
            }
        },
        {
            code: '{get;*myVariableName;-1}',
            expected: '`Index out of range`',
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Index out of range') }
            ],
            async postSetup(ctx) {
                await ctx.runtime.variables.set('*myVariableName', [1, 2, 3]);
            }
        }
    ]
});

function* generateTestCases(isTrusted: boolean, tagName: string, cases: Array<{ args: string[]; key: Parameters<SubtagTestContext['tagVariables']['get']>[0] | undefined; value: JToken | undefined; expected: string; }>): Generator<SubtagTestCase> {
    for (const { args, key, value, expected } of cases) {
        const title = isTrusted ? 'Custom command' : 'Tag';
        const code = `{${['get', ...args].join(';')}}`;
        yield {
            title: `From DB and ${title}`,
            code: code,
            expected,
            setup(ctx) {
                ctx.guild.id = '23904768237436873424';
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.users.command.id = '823764823946284623234';
                ctx.options.isTrusted = isTrusted;
                ctx.entrypoint.name = tagName;
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
                ctx.options.isTrusted = isTrusted;
                ctx.entrypoint.name = tagName;
            },
            async postSetup(bbctx) {
                await bbctx.runtime.variables.set(args[0], value);
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
                ctx.options.isTrusted = isTrusted;
                ctx.entrypoint.name = tagName;
                if (key !== undefined) {
                    if (value === undefined)
                        ctx.tagVariables.delete(key);
                    else
                        ctx.tagVariables.set(key, value);
                }
            },
            async postSetup(bbctx) {
                await bbctx.runtime.variables.set(args[0], 'FAIL');
            }
        };
    }
}
