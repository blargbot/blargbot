import { BBTagContext } from '@blargbot/bbtag';
import { RollbackSubtag } from '@blargbot/bbtag/subtags/bot/rollback';
import { TagVariableType } from '@blargbot/domain/models/index';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RollbackSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    setup(ctx) {
        ctx.options.tagName = 'testTag';
        ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, 22);
        ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var2' }, 'def');
        ctx.tagVariables.set({ scope: { type: TagVariableType.GLOBAL }, name: 'var5' }, 22);
        ctx.tagVariables.set({ scope: { type: TagVariableType.GLOBAL }, name: 'var6' }, 'def');
        ctx.tagVariables.set({ scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }, name: 'var7' }, 22);
        ctx.tagVariables.set({ scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }, name: 'var8' }, 'def');
        ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'var9' }, 22);
        ctx.tagVariables.set({ scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }, name: 'var10' }, 'def');
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
