import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { GuildSetIconSubtag } from '@blargbot/bbtag/subtags/guild/guildSetIcon.js';
import { SemiSubtag } from '@blargbot/bbtag/subtags/simple/semi.js';
import { argument } from '@blargbot/test-util/mock.js';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new GuildSetIconSubtag(),
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageGuild.toString();
    },
    cases: [
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).thenResolve(bbctx.guild);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png}',
            expected: '',
            postSetup(bbctx, ctx) {
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://cdn.discordapp.com/attachments/604763099727134750/940689576853385247/e88c2e966c6ca78f2268fa8aed4621ab1.png'))
                    .thenResolve(response.instance);
                response.setup(m => m.headers).thenReturn(new Headers({
                    'Content-Type': 'image/png'
                }));
                response.setup(m => m.arrayBuffer()).thenResolve(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf', 'base64').buffer);
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf'
                }), 'Command User#0000')).thenResolve(bbctx.guild);
            }
        },
        {
            code: '{guildseticon;https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0}',
            expected: '',
            postSetup(bbctx, ctx) {
                const response = ctx.createFetchResponse();
                ctx.dependencies.setup(m => m.fetch('https://cdn.discordapp.com/icons/194232473931087872/e88c2e966c6ca78f2268fa8aed4621ab.png?size=0'))
                    .thenResolve(response.instance);
                response.setup(m => m.headers).thenReturn(new Headers({}));
                response.setup(m => m.arrayBuffer()).thenResolve(new ArrayBuffer(0));
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:;base64,'
                }), 'Command User#0000')).thenResolve(bbctx.guild);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
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
            subtags: [new SemiSubtag()],
            expected: '`Image was not a buffer or a URL`',
            errors: [
                { start: 0, end: 21, error: new BBTagRuntimeError('Image was not a buffer or a URL') }
            ]
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: This is an error`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Failed to set icon: This is an error') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error');
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).thenReject(error);
            }
        },
        {
            code: '{guildseticon;data:image/png{semi}base64,abcdef}',
            subtags: [new SemiSubtag()],
            expected: '`Failed to set icon: And this is line 2`',
            errors: [
                { start: 0, end: 48, error: new BBTagRuntimeError('Failed to set icon: And this is line 2') }
            ],
            setup(ctx) {
                const error = ctx.createRESTError(0, 'This is an error\nAnd this is line 2');
                ctx.discord.setup(m => m.editGuild(ctx.guild.id, argument.isDeepEqual({
                    icon: 'data:image/png;base64,abcdef'
                }), 'Command User#0000')).thenReject(error);
            }
        }
    ]
});
