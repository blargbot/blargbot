import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { EmojiCreateSubtag } from '@blargbot/bbtag/subtags/guild/emojiCreate.js';
import { SemiSubtag } from '@blargbot/bbtag/subtags/simple/semi.js';
import { argument } from '@blargbot/test-util/mock.js';
import * as eris from 'eris';
import { Headers } from 'node-fetch';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new EmojiCreateSubtag(),
    argCountBounds: { min: 2, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageEmojisAndStickers.toString();
    },
    cases: [
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '23946249762743426',
            setup(ctx) {
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: [],
                    require_colons: true
                });
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '23946249762743426',
            setup(ctx) {
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'))
                    .thenResolve(response.instance);
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'image/png'
                }));
                response.setup(m => m.arrayBuffer()).thenResolve(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64'));
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: [],
                    require_colons: true
                });
            }
        },
        {
            code: '{emojicreate;My cool emoji;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '23946249762743426',
            setup(ctx) {
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0'))
                    .thenResolve(response.instance);
                response.setup(m => m.headers).thenReturn(new Headers({}));
                response.setup(m => m.arrayBuffer()).thenResolve(new Uint8Array());
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:;base64,',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: [],
                    require_colons: true
                });
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef;["9128735617428916","abc",null]}',
            subtags: [new SemiSubtag()],
            expected: '23946249762743426',
            setup(ctx) {
                ctx.roles.other.id = '9128735617428916';

                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: ['9128735617428916']
                }), 'Command User#0000')).thenResolve({
                    animated: false,
                    available: true,
                    id: '23946249762743426',
                    managed: false,
                    name: 'My cool emoji',
                    roles: ['9128735617428916'],
                    require_colons: true
                });
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Failed to find role under test');

                ctx.util.setup(m => m.findRoles(bbctx.guild, '9128735617428916')).thenResolve([role]);
                ctx.util.setup(m => m.findRoles(bbctx.guild, 'abc')).thenResolve([]);
                ctx.util.setup(m => m.findRoles(bbctx.guild, '')).thenResolve([]);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
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
            subtags: [new SemiSubtag()],
            expected: '`Name was not provided`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Name was not provided') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { start: 0, end: 34, error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: This is an error`',
            errors: [
                { start: 0, end: 61, error: new BBTagRuntimeError('Failed to create emoji: This is an error') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error');
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenReject(error);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: And this is line 2`',
            errors: [
                { start: 0, end: 61, error: new BBTagRuntimeError('Failed to create emoji: And this is line 2') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error\nAnd this is line 2');
                ctx.discord.setup(m => m.createGuildEmoji(ctx.guild.id, argument.isDeepEqual({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).thenReject(error);
            }
        }
    ]
});
