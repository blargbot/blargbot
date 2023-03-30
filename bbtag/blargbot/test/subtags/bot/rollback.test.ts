import type { BBTagScript } from '@bbtag/blargbot';
import { RollbackSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: RollbackSubtag,
    argCountBounds: { min: 0, max: Infinity },
    setupEach(ctx) {
        ctx.entrypoint.name = 'testTag';
        ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'var1' }, 22);
        ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'var2' }, 'def');
        ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'global' }, name: 'var5' }, 22);
        ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'global' }, name: 'var6' }, 'def');
        ctx.tagVariables.set({ scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' }, name: 'var7' }, 22);
        ctx.tagVariables.set({ scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' }, name: 'var8' }, 'def');
        ctx.tagVariables.set({ scope: { ownerId: BigInt(ctx.guild.id), scope: 'public:tag' }, name: 'var9' }, 22);
        ctx.tagVariables.set({ scope: { ownerId: BigInt(ctx.guild.id), scope: 'public:tag' }, name: 'var10' }, 'def');
    },
    async postSetupEach(bbctx) {
        await bbctx.runtime.variables.set('var1', 5);
        await bbctx.runtime.variables.set('var2', 'abc');
        await bbctx.runtime.variables.set('~var3', 5);
        await bbctx.runtime.variables.set('~var4', 'abc');
        await bbctx.runtime.variables.set('*var5', 5);
        await bbctx.runtime.variables.set('*var6', 'abc');
        await bbctx.runtime.variables.set('@var7', 5);
        await bbctx.runtime.variables.set('@var8', 'abc');
        await bbctx.runtime.variables.set('_var9', 5);
        await bbctx.runtime.variables.set('_var10', 'abc');
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

async function assertCacheState(bbctx: BBTagScript, expected: Record<string, JToken | undefined>): Promise<void> {
    const values = await Promise.all(Object.keys(expected).map(async k => [k, (await bbctx.runtime.variables.get(k)).value] as const));
    chai.expect(Object.fromEntries(values)).to.deep.equal(expected);
}
