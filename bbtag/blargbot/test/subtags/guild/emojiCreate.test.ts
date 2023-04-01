import { BBTagRuntimeError } from '@bbtag/blargbot';
import { EmojiCreateSubtag, SemiSubtag } from '@bbtag/blargbot/subtags';
import { Emote } from '@blargbot/discord-emote';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { setupRequestResponse } from '../setupRequestResponse.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: EmojiCreateSubtag,
    argCountBounds: { min: 2, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageEmojisAndStickers.toString();
    },
    cases: [
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [SemiSubtag],
            expected: '23946249762743426',
            postSetup(bbctx, ctx) {
                ctx.inject.guild.setup(m => m.createEmote(bbctx.runtime, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }))).thenResolve(new Emote('My cool emoji', 23946249762743426n, false));
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '23946249762743426',
            postSetup(bbctx, ctx) {
                setupRequestResponse(ctx,
                    'https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png',
                    null,
                    {
                        headers: { 'content-type': 'image/png' },
                        arrayBuffer: Buffer.from('abc12w==', 'base64')
                    }
                );
                ctx.inject.guild.setup(m => m.createEmote(bbctx.runtime, argument.isDeepEqual({
                    image: 'data:image/png;base64,abc12w==',
                    name: 'My cool emoji',
                    roles: []
                }))).thenResolve(new Emote('My cool emoji', 23946249762743426n, false));
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '23946249762743426',
            postSetup(bbctx, ctx) {
                setupRequestResponse(ctx,
                    'https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0',
                    null,
                    {
                        headers: { 'content-type': '' },
                        arrayBuffer: Buffer.from([])
                    }
                );
                ctx.inject.guild.setup(m => m.createEmote(bbctx.runtime, argument.isDeepEqual({
                    image: 'data:;base64,',
                    name: 'My cool emoji',
                    roles: []
                }))).thenResolve(new Emote('My cool emoji', 23946249762743426n, false));
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef;["9128735617428916","abc",null]}',
            subtags: [SemiSubtag],
            expected: '23946249762743426',
            setup(ctx) {
                ctx.roles.other.id = '9128735617428916';
            },
            postSetup(bbctx, ctx) {
                const role = ctx.roles.other;

                ctx.inject.guild.setup(m => m.createEmote(bbctx.runtime, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: ['9128735617428916']
                }))).thenResolve(new Emote('My cool emoji', 23946249762743426n, false));

                ctx.inject.roles.setup(m => m.querySingle(bbctx.runtime, '9128735617428916', argument.isDeepEqual({ noLookup: true }))).thenResolve(role);
                ctx.inject.roles.setup(m => m.querySingle(bbctx.runtime, 'abc', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
                ctx.inject.roles.setup(m => m.querySingle(bbctx.runtime, '', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [SemiSubtag],
            expected: '`Author cannot create emojis`',
            errors: [
                { start: 0, end: 61, error: new BBTagRuntimeError('Author cannot create emojis') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{emojicreate;;data:image/png{semi}base64,abcdef}',
            subtags: [SemiSubtag],
            expected: '`Name was not provided`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Name was not provided') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;abcdef}',
            subtags: [SemiSubtag],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [SemiSubtag],
            expected: '`Failed to create emoji: This is an error`',
            errors: [
                { start: 0, end: 61, error: new BBTagRuntimeError('Failed to create emoji: This is an error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.inject.guild.setup(m => m.createEmote(bbctx.runtime, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }))).thenResolve({ error: 'This is an error' });
            }
        }
    ]
});
