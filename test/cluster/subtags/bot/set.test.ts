import { SetSubtag } from '@cluster/subtags/bot/set';
import { snowflake } from '@cluster/utils';
import { SubtagVariableType } from '@core/types';
import { expect } from 'chai';

import { argument } from '../../../mock';
import { runSubtagTests, SubtagTestCase } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SetSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        ...createTestCases([
            {
                prefix: '~',
                varName: 'varName'
            },
            {
                prefix: '',
                db: { scope: 'testTag', type: SubtagVariableType.LOCAL },
                varName: 'varName',
                setup(ctx) {
                    ctx.options.tagName = 'testTag';
                }
            },
            {
                prefix: '',
                db: { scope: '234983689742643223984_testTag', type: SubtagVariableType.GUILDLOCAL },
                varName: 'varName',
                setup(ctx) {
                    ctx.options.tagName = 'testTag';
                    ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
                    ctx.options.isCC = true;
                }
            },
            {
                prefix: '@',
                db: { scope: '23987462839463642947', type: SubtagVariableType.AUTHOR },
                varName: 'varName',
                setup(ctx) {
                    ctx.users.command.id = '23987462839463642947';
                }
            },
            {
                prefix: '*',
                db: { scope: '', type: SubtagVariableType.GLOBAL },
                varName: 'varName'
            },
            {
                prefix: '_',
                db: { scope: '234983689742643223984', type: SubtagVariableType.GUILD },
                varName: 'varName',
                setup(ctx) {
                    ctx.guild.id = ctx.roles.everyone.id = '234983689742643223984';
                    ctx.options.isCC = true;
                }
            },
            {
                prefix: '_',
                db: { scope: '234983689742643223984', type: SubtagVariableType.TAGGUILD },
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

function* createTestCases(setups: Array<{ varName: string; prefix: string; db?: { type: SubtagVariableType; scope: string; }; setup?: SubtagTestCase['setup']; }>, cases: Array<{ args: string[]; value: JToken | undefined; }>): Generator<SubtagTestCase> {
    for (const { varName, prefix, db, setup } of setups) {
        for (const { args, value } of cases) {
            yield {
                title: 'When the value isnt forced',
                code: `{set;${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                setup,
                async assert(bbctx) {
                    expect((await bbctx.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
            yield {
                title: 'When the value has changed',
                code: `{set;!${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                async setup(ctx, ...args) {
                    if (db !== undefined) {
                        ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ [varName]: value }), db.type, db.scope))
                            .thenResolve(undefined);
                        ctx.tagVariables[`${db.type}.${db.scope}.${varName}`] = snowflake.create().toString();
                    }
                    await setup?.call(this, ctx, ...args);
                },
                async assert(bbctx) {
                    expect((await bbctx.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
            yield {
                title: 'When the value hasnt changed',
                code: `{set;!${prefix}${[varName, ...args].join(';')}}`,
                expected: '',
                setupSaveVariables: false,
                async setup(ctx, ...args) {
                    if (db !== undefined) {
                        ctx.tagVariables[`${db.type}.${db.scope}.${varName}`] = value === undefined ? undefined : JSON.parse(JSON.stringify(value));
                    }
                    await setup?.call(this, ctx, ...args);
                },
                async assert(bbctx) {
                    expect((await bbctx.variables.get(`${prefix}${varName}`)).value).to.deep.equal(value);
                }
            };
        }
    }
}
