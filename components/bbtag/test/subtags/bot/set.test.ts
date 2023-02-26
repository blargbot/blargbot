import type { TagVariableScope } from '@bbtag/blargbot';
import { Subtag, TagVariableType } from '@bbtag/blargbot';
import { SetSubtag } from '@bbtag/blargbot/subtags';
import { snowflake } from '@blargbot/discord-util';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const createSnowflake = snowflake.nextFactory();
runSubtagTests({
    subtag: Subtag.getDescriptor(SetSubtag),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        ...createTestCases([
            // {
            //     prefix: '~',
            //     varName: 'varName'
            // },
            {
                prefix: '',
                db: { name: 'testTag', type: TagVariableType.LOCAL_TAG },
                varName: 'varName',
                setup(ctx) {
                    ctx.options.tagName = 'testTag';
                }
            },
            {
                prefix: '',
                db: { guildId: '234983689742643223984', name: 'testTag', type: TagVariableType.LOCAL_CC },
                varName: 'varName',
                setup(ctx) {
                    ctx.options.tagName = 'testTag';
                    ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
                    ctx.options.isCC = true;
                }
            },
            {
                prefix: '@',
                db: { authorId: '23987462839463642947', type: TagVariableType.AUTHOR },
                varName: 'varName',
                setup(ctx) {
                    ctx.users.command.id = '23987462839463642947';
                }
            },
            {
                prefix: '*',
                db: { type: TagVariableType.GLOBAL },
                varName: 'varName'
            },
            {
                prefix: '_',
                db: { guildId: '234983689742643223984', type: TagVariableType.GUILD_CC },
                varName: 'varName',
                setup(ctx) {
                    ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
                    ctx.options.isCC = true;
                }
            },
            {
                prefix: '_',
                db: { guildId: '234983689742643223984', type: TagVariableType.GUILD_TAG },
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

function* createTestCases(setups: Array<{ varName: string; prefix: string; db?: TagVariableScope; setup?: SubtagTestCase['setup']; }>, cases: Array<{ args: string[]; value: JToken | undefined; }>): Generator<SubtagTestCase> {
    for (const { varName, prefix, db, setup } of setups) {
        for (const { args, value } of cases) {
            yield {
                title: 'When the value isnt forced',
                code: `{set;${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                setup,
                async assert(bbctx) {
                    chai.expect((await bbctx.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
            yield {
                title: 'When the value has changed',
                code: `{set;!${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                async setup(ctx, ...args) {
                    if (db !== undefined) {
                        ctx.tagVariablesTable.setup(m => m.set(argument.isDeepEqual([{ name: varName, value, scope: db }])))
                            .thenResolve(undefined);
                        ctx.tagVariables.set({ scope: db, name: varName }, createSnowflake());
                    }
                    await setup?.call(this, ctx, ...args);
                },
                async assert(bbctx) {
                    chai.expect((await bbctx.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
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
                    chai.expect((await bbctx.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
        }
    }
}
