import type { BBTagScope } from '@bbtag/blargbot';
import { SetSubtag } from '@bbtag/blargbot/subtags';
import snowflake from '@blargbot/snowflakes';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const createSnowflake = snowflake.nextFactory().create;
runSubtagTests({
    subtag: SetSubtag,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        ...createTestCases([
            // {
            //     prefix: '~',
            //     varName: 'varName'
            // },
            {
                prefix: '',
                db: { ownerId: 0n, scope: 'local:tag:testTag' },
                varName: 'varName',
                setup(ctx) {
                    ctx.entrypoint.name = 'testTag';
                }
            },
            {
                prefix: '',
                db: { ownerId: 234983689742643223984n, scope: 'local:cc:testTag' },
                varName: 'varName',
                setup(ctx) {
                    ctx.entrypoint.name = 'testTag';
                    ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
                    ctx.options.type = 'cc';
                }
            },
            {
                prefix: '@',
                db: { ownerId: 23987462839463642947n, scope: 'global' },
                varName: 'varName',
                setup(ctx) {
                    ctx.users.command.id = '23987462839463642947';
                }
            },
            {
                prefix: '*',
                db: { ownerId: 0n, scope: 'global' },
                varName: 'varName'
            },
            {
                prefix: '_',
                db: { ownerId: 234983689742643223984n, scope: 'secret' },
                varName: 'varName',
                setup(ctx) {
                    ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
                    ctx.options.type = 'cc';
                }
            },
            {
                prefix: '_',
                db: { ownerId: 234983689742643223984n, scope: 'public:tag' },
                varName: 'varName',
                setup(ctx) {
                    ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
                }
            }
        ], [
            { args: [], value: undefined },
            { args: ['a'], value: 'a' },
            { args: ['a', 'b', 'c'], value: ['a', 'b', 'c'] },
            { args: ['[1,2,3]'], value: [1, 2, 3] },
            { args: ['[a,b,c]'], value: '[a,b,c]' },
            { args: ['["a","b","c"]'], value: ['a', 'b', 'c'] },
            { args: ['[1,2,3]', 'a', 'b'], value: ['[1,2,3]', 'a', 'b'] }
        ])
    ]
});

function* createTestCases(setups: Array<{ varName: string; prefix: string; db?: BBTagScope; setup?: SubtagTestCase['setup']; }>, cases: Array<{ args: string[]; value: JToken | undefined; }>): Generator<SubtagTestCase> {
    for (const { varName, prefix, db, setup } of setups) {
        for (const { args, value } of cases) {
            yield {
                title: 'When the value isnt forced',
                code: `{set;${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                setup,
                async assert(bbctx) {
                    chai.expect((await bbctx.runtime.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
            yield {
                title: 'When the value has changed',
                code: `{set;!${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                async setup(ctx, ...args) {
                    if (db !== undefined) {
                        ctx.variables.setup(m => m.set(argument.isDeepEqual([{ name: varName, value, scope: db }])))
                            .thenResolve(undefined);
                        ctx.tagVariables.set({ scope: db, name: varName }, createSnowflake());
                    }
                    await setup?.call(this, ctx, ...args);
                },
                async assert(bbctx) {
                    chai.expect((await bbctx.runtime.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
            yield {
                title: 'When the value hasnt changed',
                code: `{set;!${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                async setup(ctx, ...args) {
                    if (db !== undefined) {
                        if (value === undefined)
                            ctx.tagVariables.delete({ scope: db, name: varName });
                        else
                            ctx.tagVariables.set({ scope: db, name: varName }, JSON.parse(JSON.stringify(value)));
                    }
                    await setup?.call(this, ctx, ...args);
                },
                async assert(bbctx) {
                    chai.expect((await bbctx.runtime.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
        }
    }
}
