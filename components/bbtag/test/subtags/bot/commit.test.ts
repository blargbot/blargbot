import { Subtag } from '@blargbot/bbtag';
import { CommitSubtag } from '@blargbot/bbtag/subtags/bot/commit.js';
import { TagVariableType } from '@blargbot/domain/models/index.js';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(CommitSubtag),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{commit}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.rootTagName = 'commitTest';

                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var1: 5, var2: 'abc' }), argument.isDeepEqual({ type: TagVariableType.LOCAL_TAG, name: 'commitTest' }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var5: 5, var6: 'abc' }), argument.isDeepEqual({ type: TagVariableType.GLOBAL }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var7: 5, var8: 'abc' }), argument.isDeepEqual({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var9: 5, var10: 'abc' }), argument.isDeepEqual({ type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }))).thenResolve(undefined);
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
            }
        },
        {
            code: '{commit}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.rootTagName = 'commitTest';
                ctx.options.isCC = true;

                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var1: 5, var2: 'abc' }), argument.isDeepEqual({ type: TagVariableType.LOCAL_CC, guildId: ctx.guild.id, name: 'commitTest' }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var5: 5, var6: 'abc' }), argument.isDeepEqual({ type: TagVariableType.GLOBAL }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var7: 5, var8: 'abc' }), argument.isDeepEqual({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var9: 5, var10: 'abc' }), argument.isDeepEqual({ type: TagVariableType.GUILD_CC, guildId: ctx.guild.id }))).thenResolve(undefined);
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
            }
        },
        {
            code: '{commit;var1;["~var3","*var5"];[];@var7;_var9}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.rootTagName = 'commitTest';

                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var1: 5 }), argument.isDeepEqual({ type: TagVariableType.LOCAL_TAG, name: 'commitTest' }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var5: 5 }), argument.isDeepEqual({ type: TagVariableType.GLOBAL }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var7: 5 }), argument.isDeepEqual({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var9: 5 }), argument.isDeepEqual({ type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id }))).thenResolve(undefined);
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
            }
        },
        {
            code: '{commit;var2;["~var4","*var6"];[];@var8;_var10}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.rootTagName = 'commitTest';
                ctx.options.isCC = true;

                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var2: 'abc' }), argument.isDeepEqual({ type: TagVariableType.LOCAL_CC, guildId: ctx.guild.id, name: 'commitTest' }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var6: 'abc' }), argument.isDeepEqual({ type: TagVariableType.GLOBAL }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var8: 'abc' }), argument.isDeepEqual({ type: TagVariableType.AUTHOR, authorId: ctx.users.command.id }))).thenResolve(undefined);
                ctx.tagVariablesTable.setup(m => m.upsert(argument.isDeepEqual({ var10: 'abc' }), argument.isDeepEqual({ type: TagVariableType.GUILD_CC, guildId: ctx.guild.id }))).thenResolve(undefined);
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
            }
        },
        {
            code: '{commit;unknown variable}',
            expected: '',
            setupSaveVariables: false,
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
            }
        }
    ]
});
