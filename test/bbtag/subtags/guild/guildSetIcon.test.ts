import { BBTagRuntimeError } from '@blargbot/bbtag';
import { GuildSetIconSubtag, SemiSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import { asUint8Array } from '@blargbot/util';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const fetch = new Mock<typeof globalThis.fetch>({ id: 'fetch', callable: true });

await runSubtagTests({
    subtag: new GuildSetIconSubtag({
        fetch: fetch.instance
    }),
    argCountBounds: { min: 1, max: 1 },
    names: ['guildSetIcon'],
    setup(ctx) {
        ctx.adoptMock(fetch);
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageGuild.toString();
    },
    cases: [
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.discord.setup((m, $) => m.editGuild(ctx.guild.id, $({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).resolves(bbctx.root.message.channel.guild);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '',
            postSetup(bbctx, ctx) {
                const response = ctx.createMock<Response>({ id: 'response' });
                fetch.setup(m => m('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({
                    'Content-Type': 'image/png'
                }));
                response.setup(m => m.bytes()).resolves(asUint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64')));
                ctx.discord.setup((m, $) => m.editGuild(ctx.guild.id, $({
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf'
                }), 'Command User#0000')).resolves(bbctx.root.message.channel.guild);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '',
            postSetup(bbctx, ctx) {
                const response = ctx.createMock<Response>({ id: 'response' });
                fetch.setup(m => m('https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0'))
                    .resolves(response.instance);
                response.setup(m => m.headers).returns(new Headers({}));
                response.setup(m => m.bytes()).resolves(new Uint8Array(0));
                ctx.discord.setup((m, $) => m.editGuild(ctx.guild.id, $({
                    icon: 'data:;base64,'
                }), 'Command User#0000')).resolves(bbctx.root.message.channel.guild);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Author cannot modify the guild`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot modify the guild') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{guildseticon;abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: This is an error`',
            errors: [
                { error: new BBTagRuntimeError('Failed to set icon: This is an error') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error');
                ctx.discord.setup((m, $) => m.editGuild(ctx.guild.id, $({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).rejects(error);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: And this is line 2`',
            errors: [
                { error: new BBTagRuntimeError('Failed to set icon: And this is line 2') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error\nAnd this is line 2');
                ctx.discord.setup((m, $) => m.editGuild(ctx.guild.id, $({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).rejects(error);
            }
        }
    ]
});
