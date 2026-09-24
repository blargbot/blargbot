import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<VariablesLocals>({
    replacer: replacers.setReplacer,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{set;deleteVar}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'deleteVar', undefined);
            }
        },
        {
            code: '{set;emptyVar;}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'emptyVar', '');
            }
        },
        {
            code: '{set;stringVar;Success!}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'stringVar', 'Success!');
            }
        },
        {
            code: '{set;numberLikeVar;123}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'numberLikeVar', '123');
            }
        },
        {
            code: '{set;trueVar;true}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'trueVar', 'true');
            }
        },
        {
            code: '{set;falseVar;false}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'falseVar', 'false');
            }
        },
        {
            code: '{set;arrayVar;[1,2,3,4,true,false,null,"abc"]}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'arrayVar', [1, 2, 3, 4, true, false, null, 'abc']);
            }
        },
        {
            code: '{set;objectVar;{j;{"test":"success"}}}',
            expected: '',
            replacers: [replacers.jsonReplacer],
            setup(ctx) {
                setupVariables(ctx, 'objectVar', '{"test":"success"}');
            }
        },
        {
            code: '{set;multipleValues;1;2;3;4;true;false;null;abc;[null]}',
            expected: '',
            setup(ctx) {
                setupVariables(ctx, 'multipleValues', ['1', '2', '3', '4', 'true', 'false', 'null', 'abc', '[null]']);
            }
        }
    ]
});

function setupVariables(context: SubtagTestContext<VariablesLocals>, varName: string, set: JToken | undefined): void {
    const variables = context.createMock<VariableStore>();
    context.locals.setup(m => m.variables).returns(variables.instance);
    variables.setup((m, $) => m.set(varName, $(set))).returns().mustHappen();
}

// TODO: Move these tests to test the actual implementation of the VariableStore when that is done
// await runSubtagTests({
//     replacer: replacers.setReplacer,
//     argCountBounds: { min: 1, max: Infinity },
//     cases: [
//         ...createTestCases([
//             // {
//             //     prefix: '~',
//             //     varName: 'varName'
//             // },
//             {
//                 prefix: '',
//                 db: { name: 'testTag', type: TagVariableType.LOCAL_TAG },
//                 varName: 'varName',
//                 setup(ctx) {
//                     ctx.options.tagName = 'testTag';
//                 }
//             },
//             {
//                 prefix: '',
//                 db: { guildId: '234983689742643223984', name: 'testTag', type: TagVariableType.LOCAL_CC },
//                 varName: 'varName',
//                 setup(ctx) {
//                     ctx.options.tagName = 'testTag';
//                     ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
//                     ctx.options.isCC = true;
//                 }
//             },
//             {
//                 prefix: '@',
//                 db: { authorId: '23987462839463642947', type: TagVariableType.AUTHOR },
//                 varName: 'varName',
//                 setup(ctx) {
//                     ctx.users.command.id = '23987462839463642947';
//                 }
//             },
//             {
//                 prefix: '*',
//                 db: { type: TagVariableType.GLOBAL },
//                 varName: 'varName'
//             },
//             {
//                 prefix: '_',
//                 db: { guildId: '234983689742643223984', type: TagVariableType.GUILD_CC },
//                 varName: 'varName',
//                 setup(ctx) {
//                     ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
//                     ctx.options.isCC = true;
//                 }
//             },
//             {
//                 prefix: '_',
//                 db: { guildId: '234983689742643223984', type: TagVariableType.GUILD_TAG },
//                 varName: 'varName',
//                 setup(ctx) {
//                     ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
//                 }
//             }
//         ], [
//             { args: [], value: undefined },
//             { args: ['a'], value: 'a' },
//             { args: ['a', 'b', 'c'], value: ['a', 'b', 'c'] },
//             { args: ['[1,2,3]'], value: [1, 2, 3] },
//             { args: ['[a,b,c]'], value: '[a,b,c]' },
//             { args: ['["a","b","c"]'], value: ['a', 'b', 'c'] },
//             { args: ['[1,2,3]', 'a', 'b'], value: ['[1,2,3]', 'a', 'b'] }
//         ])
//     ]
// });

// function* createTestCases(setups: Array<{ varName: string; prefix: string; db?: TagVariableScope; setup?: SubtagTestCase['setup']; }>, cases: Array<{ args: string[]; value: JToken | undefined; }>): Generator<SubtagTestCase> {
//     for (const { varName, prefix, db, setup } of setups) {
//         for (const { args, value } of cases) {
//             yield {
//                 title: 'When the value isnt forced',
//                 code: `{set;${prefix}${[varName, ...args].join(';')}}`,
//                 expected: '',
//                 setupSaveVariables: false,
//                 setup,
//                 async assert(bbctx) {
//                     assert.deepEqual((await bbctx.variables.get(`${prefix}${varName}`)).value, value);
//                 }
//             };
//             yield {
//                 title: 'When the value has changed',
//                 code: `{set;!${prefix}${[varName, ...args].join(';')}}`,
//                 expected: '',
//                 setupSaveVariables: false,
//                 async setup(ctx, ...args) {
//                     if (db !== undefined) {
//                         ctx.tagVariablesTable.setup(m => m.upsert($.looksLike({ [varName]: value }), $.looksLike(db)))
//                             .thenResolve(undefined);
//                         ctx.tagVariables.set({ scope: db, name: varName }, snowflake.create().toString());
//                     }
//                     await setup?.call(this, ctx, ...args);
//                 },
//                 async assert(bbctx) {
//                     assert.deepEqual((await bbctx.variables.get(`${prefix}${varName}`)).value, value);
//                 }
//             };
//             yield {
//                 title: 'When the value hasnt changed',
//                 code: `{set;!${prefix}${[varName, ...args].join(';')}}`,
//                 expected: '',
//                 setupSaveVariables: false,
//                 async setup(ctx, ...args) {
//                     if (db !== undefined) {
//                         if (value === undefined)
//                             ctx.tagVariables.delete({ scope: db, name: varName });
//                         else
//                             ctx.tagVariables.set({ scope: db, name: varName }, JSON.parse(JSON.stringify(value)));
//                     }
//                     await setup?.call(this, ctx, ...args);
//                 },
//                 async assert(bbctx) {
//                     assert.deepEqual((await bbctx.variables.get(`${prefix}${varName}`)).value, value);
//                 }
//             };
//         }
//     }
// }
