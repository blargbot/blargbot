import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import { EmojiCreateSubtag, SemiSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import { asUint8Array } from '@blargbot/util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const fetch = new Mock<typeof globalThis.fetch>({ id: 'fetch', callable: true });

await runSubtagTests({
    subtag: new EmojiCreateSubtag({
        fetch: fetch.instance
    }),
    argCountBounds: { min: 2, max: 3 },
    names: ['emojiCreate'],
    setup(ctx) {
        ctx.adoptMock(fetch);
        ctx.roles.authorizer.permissions = DiscordPermissions.CREATE_GUILD_EXPRESSIONS.toString();
    },
    cases: [
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '23946249762743426',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.createGuildEmoji(ctx.guild.id, $({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).resolves({
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
                const response = ctx.createMock<Response>({ id: 'response' });
                fetch.setup(m => m('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'image/png'
                }));
                response.setup(m => m.bytes()).resolves(asUint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64')));
                ctx.discord.setup((m, $) => m.createGuildEmoji(ctx.guild.id, $({
                    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).resolves({
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
                const response = ctx.createMock<Response>({ id: 'response' });
                fetch.setup(m => m('https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({}));
                response.setup(m => m.bytes()).resolves(new Uint8Array(0));
                ctx.discord.setup((m, $) => m.createGuildEmoji(ctx.guild.id, $({
                    image: 'data:;base64,',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).resolves({
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

                ctx.discord.setup((m, $) => m.createGuildEmoji(ctx.guild.id, $({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: ['9128735617428916']
                }), 'Command User#0000')).resolves({
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
                const role = bbctx.root.message.channel.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Failed to find role under test');

                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, '9128735617428916')).resolves([role]);
                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, 'abc')).resolves([]);
                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, '')).resolves([]);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Author cannot create emojis`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot create emojis') }
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
                { error: new BBTagRuntimeError('Name was not provided') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: This is an error`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create emoji: This is an error') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error');
                ctx.discord.setup((m, $) => m.createGuildEmoji(ctx.guild.id, $({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).rejects(error);
            }
        },
        {
            code: '{emojicreate;My cool emoji;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to create emoji: And this is line 2`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create emoji: And this is line 2') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error\nAnd this is line 2');
                ctx.discord.setup((m, $) => m.createGuildEmoji(ctx.guild.id, $({
                    image: 'data:image/png;base64,abcdef',
                    name: 'My cool emoji',
                    roles: []
                }), 'Command User#0000')).rejects(error);
            }
        }
    ]
});
