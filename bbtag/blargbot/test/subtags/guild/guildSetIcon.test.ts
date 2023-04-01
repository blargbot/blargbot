import { BBTagRuntimeError } from '@bbtag/blargbot';
import { GuildSetIconSubtag, SemiSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { setupRequestResponse } from '../setupRequestResponse.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: GuildSetIconSubtag,
    argCountBounds: { min: 1, max: 1 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageGuild.toString();
    },
    cases: [
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [SemiSubtag],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.inject.guild.setup(m => m.edit(bbctx.runtime, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '',
            postSetup(bbctx, ctx) {
                setupRequestResponse(ctx,
                    'https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png',
                    null,
                    {
                        headers: { 'content-type': 'image/png' },
                        arrayBuffer: Buffer.from('abc12w==', 'base64')
                    }
                );
                ctx.inject.guild.setup(m => m.edit(bbctx.runtime, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abc12w=='
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '',
            postSetup(bbctx, ctx) {
                setupRequestResponse(ctx,
                    'https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0',
                    null,
                    {
                        headers: { 'content-type': '' },
                        arrayBuffer: Buffer.from([])
                    }
                );
                ctx.inject.guild.setup(m => m.edit(bbctx.runtime, argument.isDeepEqual({
                    icon: 'data:;base64,'
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [SemiSubtag],
            expected: '`Author cannot modify the guild`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Author cannot modify the guild') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{guildseticon;abcdef}',
            subtags: [SemiSubtag],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { start: 0, end: 21, error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [SemiSubtag],
            expected: '`Failed to set icon: This is an error`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Failed to set icon: This is an error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.guild.setup(m => m.edit(bbctx.runtime, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }))).thenResolve({ error: 'This is an error' });
            }
        }
    ]
});
