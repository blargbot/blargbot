import { BBTagContext } from '@cluster/bbtag';
import { RollbackSubtag } from '@cluster/subtags/bot/rollback';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RollbackSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    setup(ctx) {
        ctx.options.tagName = 'testTag';
        ctx.tagVariables['LOCAL_TAG.testTag.var1'] = 22;
        ctx.tagVariables['LOCAL_TAG.testTag.var2'] = 'def';
        ctx.tagVariables['GLOBAL..var5'] = 22;
        ctx.tagVariables['GLOBAL..var6'] = 'def';
        ctx.tagVariables[`AUTHOR.${ctx.users.command.id}.var7`] = 22;
        ctx.tagVariables[`AUTHOR.${ctx.users.command.id}.var8`] = 'def';
        ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.var9`] = 22;
        ctx.tagVariables[`GUILD_TAG.${ctx.guild.id}.var10`] = 'def';
    },
    async postSetup(bbctx) {
        await bbctx.variables.set('var1', 5);
        await bbctx.variables.set('var2', 'abc');
        await bbctx.variables.set('~var3', 5);
        await bbctx.variables.set('~var4', 'abc');
        await bbctx.variables.set('*var5', 5);
        await bbctx.variables.set('*var6', 'abc');
        await bbctx.variables.set('@var7', 5);
        await bbctx.variables.set('@var8', 'abc');
        await bbctx.variables.set('_var9', 5);
        await bbctx.variables.set('_var10', 'abc');
    },
    cases: [
        {
            code: '{rollback}',
            setupSaveVariables: false,
            async assert(bbctx) {
                await assertCacheState(bbctx, {
                    ['~var3']: undefined,
                    ['~var4']: undefined,
                    ['var1']: 22,
                    ['var2']: 'def',
                    ['*var5']: 22,
                    ['*var6']: 'def',
                    ['@var7']: 22,
                    ['@var8']: 'def',
                    ['_var9']: 22,
                    ['_var10']: 'def'
                });
            }
        },
        {
            code: '{rollback;var2;~var4;["*var6","@var8"];[];_var10}',
            setupSaveVariables: false,
            async assert(bbctx) {
                await assertCacheState(bbctx, {
                    ['var1']: 5,
                    ['var2']: 'def',
                    ['~var3']: 5,
                    ['~var4']: undefined,
                    ['*var5']: 5,
                    ['*var6']: 'def',
                    ['@var7']: 5,
                    ['@var8']: 'def',
                    ['_var9']: 5,
                    ['_var10']: 'def'
                });
            }
        }
    ]
});

async function assertCacheState(bbctx: BBTagContext, expected: Record<string, JToken | undefined>): Promise<void> {
    const values = await Promise.all(Object.keys(expected).map(async k => [k, (await bbctx.variables.get(k)).value] as const));
    expect(Object.fromEntries(values)).to.deep.equal(expected);
}
