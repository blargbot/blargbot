import { CommitSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: CommitSubtag,
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{commit}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'commitTest';
            },
            async postSetup(bbctx, ctx) {
                ctx.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var1', value: 5, scope: { ownerId: 0n, scope: 'local:tag:commitTest' } },
                    { name: 'var2', value: 'abc', scope: { ownerId: 0n, scope: 'local:tag:commitTest' } },
                    { name: 'var3', value: 5, scope: { ownerId: 0n, scope: `temp:${bbctx.runtime.id}` } },
                    { name: 'var4', value: 'abc', scope: { ownerId: 0n, scope: `temp:${bbctx.runtime.id}` } },
                    { name: 'var5', value: 5, scope: { ownerId: 0n, scope: 'global' } },
                    { name: 'var6', value: 'abc', scope: { ownerId: 0n, scope: 'global' } },
                    { name: 'var7', value: 5, scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' } },
                    { name: 'var8', value: 'abc', scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' } },
                    { name: 'var9', value: 5, scope: { ownerId: BigInt(ctx.guild.id), scope: 'public:tag' } },
                    { name: 'var10', value: 'abc', scope: { ownerId: BigInt(ctx.guild.id), scope: 'public:tag' } }
                ]))).thenResolve(undefined);

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
            }
        },
        {
            code: '{commit}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'commitTest';
                ctx.options.type = 'cc';
            },
            async postSetup(bbctx, ctx) {
                ctx.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var1', value: 5, scope: { ownerId: BigInt(ctx.guild.id), scope: 'local:cc:commitTest' } },
                    { name: 'var2', value: 'abc', scope: { ownerId: BigInt(ctx.guild.id), scope: 'local:cc:commitTest' } },
                    { name: 'var3', value: 5, scope: { ownerId: 0n, scope: `temp:${bbctx.runtime.id}` } },
                    { name: 'var4', value: 'abc', scope: { ownerId: 0n, scope: `temp:${bbctx.runtime.id}` } },
                    { name: 'var5', value: 5, scope: { ownerId: 0n, scope: 'global' } },
                    { name: 'var6', value: 'abc', scope: { ownerId: 0n, scope: 'global' } },
                    { name: 'var7', value: 5, scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' } },
                    { name: 'var8', value: 'abc', scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' } },
                    { name: 'var9', value: 5, scope: { ownerId: BigInt(ctx.guild.id), scope: 'secret' } },
                    { name: 'var10', value: 'abc', scope: { ownerId: BigInt(ctx.guild.id), scope: 'secret' } }
                ]))).thenResolve(undefined);

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
            }
        },
        {
            code: '{commit;var1;["~var3","*var5"];[];@var7;_var9}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'commitTest';
            },
            async postSetup(bbctx, ctx) {
                ctx.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var1', value: 5, scope: { ownerId: 0n, scope: 'local:tag:commitTest' } },
                    { name: 'var3', value: 5, scope: { ownerId: 0n, scope: `temp:${bbctx.runtime.id}` } },
                    { name: 'var5', value: 5, scope: { ownerId: 0n, scope: 'global' } },
                    { name: 'var7', value: 5, scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' } },
                    { name: 'var9', value: 5, scope: { ownerId: BigInt(ctx.guild.id), scope: 'public:tag' } }
                ]))).thenResolve(undefined);

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
            }
        },
        {
            code: '{commit;var2;["~var4","*var6"];[];@var8;_var10}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'commitTest';
                ctx.options.type = 'cc';
            },
            async postSetup(bbctx, ctx) {
                ctx.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var2', value: 'abc', scope: { ownerId: BigInt(ctx.guild.id), scope: 'local:cc:commitTest' } },
                    { name: 'var4', value: 'abc', scope: { ownerId: 0n, scope: `temp:${bbctx.runtime.id}` } },
                    { name: 'var6', value: 'abc', scope: { ownerId: 0n, scope: 'global' } },
                    { name: 'var8', value: 'abc', scope: { ownerId: BigInt(ctx.users.command.id), scope: 'global' } },
                    { name: 'var10', value: 'abc', scope: { ownerId: BigInt(ctx.guild.id), scope: 'secret' } }
                ]))).thenResolve(undefined);

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
            }
        },
        {
            code: '{commit;unknown variable}',
            expected: '',
            setupSaveVariables: false,
            async postSetup(bbctx) {
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
            }
        }
    ]
});
