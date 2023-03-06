import { Subtag, TagVariableType } from '@bbtag/blargbot';
import { CommitSubtag } from '@bbtag/blargbot/subtags';
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

                ctx.dependencies.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var1', value: 5, scope: { type: TagVariableType.LOCAL_TAG, name: 'commitTest' } },
                    { name: 'var2', value: 'abc', scope: { type: TagVariableType.LOCAL_TAG, name: 'commitTest' } },
                    { name: 'var3', value: 5, scope: { type: TagVariableType.TEMP } },
                    { name: 'var4', value: 'abc', scope: { type: TagVariableType.TEMP } },
                    { name: 'var5', value: 5, scope: { type: TagVariableType.GLOBAL } },
                    { name: 'var6', value: 'abc', scope: { type: TagVariableType.GLOBAL } },
                    { name: 'var7', value: 5, scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id } },
                    { name: 'var8', value: 'abc', scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id } },
                    { name: 'var9', value: 5, scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id } },
                    { name: 'var10', value: 'abc', scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id } }
                ]))).thenResolve(undefined);
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

                ctx.dependencies.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var1', value: 5, scope: { type: TagVariableType.LOCAL_CC, guildId: ctx.guild.id, name: 'commitTest' } },
                    { name: 'var2', value: 'abc', scope: { type: TagVariableType.LOCAL_CC, guildId: ctx.guild.id, name: 'commitTest' } },
                    { name: 'var3', value: 5, scope: { type: TagVariableType.TEMP } },
                    { name: 'var4', value: 'abc', scope: { type: TagVariableType.TEMP } },
                    { name: 'var5', value: 5, scope: { type: TagVariableType.GLOBAL } },
                    { name: 'var6', value: 'abc', scope: { type: TagVariableType.GLOBAL } },
                    { name: 'var7', value: 5, scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id } },
                    { name: 'var8', value: 'abc', scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id } },
                    { name: 'var9', value: 5, scope: { type: TagVariableType.GUILD_CC, guildId: ctx.guild.id } },
                    { name: 'var10', value: 'abc', scope: { type: TagVariableType.GUILD_CC, guildId: ctx.guild.id } }
                ]))).thenResolve(undefined);
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

                ctx.dependencies.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var1', value: 5, scope: { type: TagVariableType.LOCAL_TAG, name: 'commitTest' } },
                    { name: 'var3', value: 5, scope: { type: TagVariableType.TEMP } },
                    { name: 'var5', value: 5, scope: { type: TagVariableType.GLOBAL } },
                    { name: 'var7', value: 5, scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id } },
                    { name: 'var9', value: 5, scope: { type: TagVariableType.GUILD_TAG, guildId: ctx.guild.id } }
                ]))).thenResolve(undefined);
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

                ctx.dependencies.variables.setup(m => m.set(argument.isDeepEqual([
                    { name: 'var2', value: 'abc', scope: { type: TagVariableType.LOCAL_CC, guildId: ctx.guild.id, name: 'commitTest' } },
                    { name: 'var4', value: 'abc', scope: { type: TagVariableType.TEMP } },
                    { name: 'var6', value: 'abc', scope: { type: TagVariableType.GLOBAL } },
                    { name: 'var8', value: 'abc', scope: { type: TagVariableType.AUTHOR, authorId: ctx.users.command.id } },
                    { name: 'var10', value: 'abc', scope: { type: TagVariableType.GUILD_CC, guildId: ctx.guild.id } }
                ]))).thenResolve(undefined);
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
