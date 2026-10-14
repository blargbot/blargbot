import { CommitSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new CommitSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    names: ['commit'],
    cases: [
        {
            code: '{commit}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'commitTest';

                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var1: 5, var2: 'abc' }), $({ type: TagVariableType.LOCAL_TAG, name: 'commitTest' }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var5: 5, var6: 'abc' }), $({ type: TagVariableType.GLOBAL }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var7: 5, var8: 'abc' }), $({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var9: 5, var10: 'abc' }), $({ type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }))).resolves(undefined);
            },
            async postSetup(bbctx) {
                await bbctx.root.variables.set('var1', 5);
                await bbctx.root.variables.set('var2', 'abc');
                await bbctx.root.variables.set('~var3', 5);
                await bbctx.root.variables.set('~var4', 'abc');
                await bbctx.root.variables.set('*var5', 5);
                await bbctx.root.variables.set('*var6', 'abc');
                await bbctx.root.variables.set('@var7', 5);
                await bbctx.root.variables.set('@var8', 'abc');
                await bbctx.root.variables.set('_var9', 5);
                await bbctx.root.variables.set('_var10', 'abc');
            }
        },
        {
            code: '{commit}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'commitTest';
                ctx.input.tagVars = false;

                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var1: 5, var2: 'abc' }), $({ type: TagVariableType.LOCAL_CC, guildId: ctx.guild.id, name: 'commitTest' }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var5: 5, var6: 'abc' }), $({ type: TagVariableType.GLOBAL }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var7: 5, var8: 'abc' }), $({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var9: 5, var10: 'abc' }), $({ type: TagVariableType.GUILD_CC, guildId: ctx.guild.id }))).resolves(undefined);
            },
            async postSetup(bbctx) {
                await bbctx.root.variables.set('var1', 5);
                await bbctx.root.variables.set('var2', 'abc');
                await bbctx.root.variables.set('~var3', 5);
                await bbctx.root.variables.set('~var4', 'abc');
                await bbctx.root.variables.set('*var5', 5);
                await bbctx.root.variables.set('*var6', 'abc');
                await bbctx.root.variables.set('@var7', 5);
                await bbctx.root.variables.set('@var8', 'abc');
                await bbctx.root.variables.set('_var9', 5);
                await bbctx.root.variables.set('_var10', 'abc');
            }
        },
        {
            code: '{commit;var1;["~var3","*var5"];[];@var7;_var9}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'commitTest';

                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var1: 5 }), $({ type: TagVariableType.LOCAL_TAG, name: 'commitTest' }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var5: 5 }), $({ type: TagVariableType.GLOBAL }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var7: 5 }), $({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var9: 5 }), $({ type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }))).resolves(undefined);
            },
            async postSetup(bbctx) {
                await bbctx.root.variables.set('var1', 5);
                await bbctx.root.variables.set('var2', 'abc');
                await bbctx.root.variables.set('~var3', 5);
                await bbctx.root.variables.set('~var4', 'abc');
                await bbctx.root.variables.set('*var5', 5);
                await bbctx.root.variables.set('*var6', 'abc');
                await bbctx.root.variables.set('@var7', 5);
                await bbctx.root.variables.set('@var8', 'abc');
                await bbctx.root.variables.set('_var9', 5);
                await bbctx.root.variables.set('_var10', 'abc');
            }
        },
        {
            code: '{commit;var2;["~var4","*var6"];[];@var8;_var10}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.input.tagName = 'commitTest';
                ctx.input.tagVars = false;

                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var2: 'abc' }), $({ type: TagVariableType.LOCAL_CC, guildId: ctx.guild.id, name: 'commitTest' }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var6: 'abc' }), $({ type: TagVariableType.GLOBAL }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var8: 'abc' }), $({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).resolves(undefined);
                ctx.tagVariablesTable.setup((m, $) => m.upsert($({ var10: 'abc' }), $({ type: TagVariableType.GUILD_CC, guildId: ctx.guild.id }))).resolves(undefined);
            },
            async postSetup(bbctx) {
                await bbctx.root.variables.set('var1', 5);
                await bbctx.root.variables.set('var2', 'abc');
                await bbctx.root.variables.set('~var3', 5);
                await bbctx.root.variables.set('~var4', 'abc');
                await bbctx.root.variables.set('*var5', 5);
                await bbctx.root.variables.set('*var6', 'abc');
                await bbctx.root.variables.set('@var7', 5);
                await bbctx.root.variables.set('@var8', 'abc');
                await bbctx.root.variables.set('_var9', 5);
                await bbctx.root.variables.set('_var10', 'abc');
            }
        },
        {
            code: '{commit;unknown variable}',
            expected: '',
            setupSaveVariables: false,
            async postSetup(bbctx) {
                await bbctx.root.variables.set('var1', 5);
                await bbctx.root.variables.set('var2', 'abc');
                await bbctx.root.variables.set('~var3', 5);
                await bbctx.root.variables.set('~var4', 'abc');
                await bbctx.root.variables.set('*var5', 5);
                await bbctx.root.variables.set('*var6', 'abc');
                await bbctx.root.variables.set('@var7', 5);
                await bbctx.root.variables.set('@var8', 'abc');
                await bbctx.root.variables.set('_var9', 5);
                await bbctx.root.variables.set('_var10', 'abc');
            }
        }
    ]
});
