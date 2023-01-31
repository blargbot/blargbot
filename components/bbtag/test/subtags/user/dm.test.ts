import type { Entities } from '@blargbot/bbtag';
import { Subtag, UserNotFoundError } from '@blargbot/bbtag';
import { DMSubtag, EscapeBBTagSubtag  } from '@blargbot/bbtag/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import { randomUUID } from 'crypto';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(DMSubtag),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{dm;aaaa;{eval}}',
            expected: '`No user found`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 0, end: 16, error: new UserNotFoundError('aaaa') }
            ],
            postSetup(bbctx, ctx) {
                ctx.options.rootTagName = 'mySuperCoolTestingTag';
                ctx.userService.setup(m => m.querySingle(bbctx, 'aaaa')).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{dm;other user;Hello!}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                const channelId = randomUUID();
                user.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user')).verifiable(1).thenResolve(user.instance);
                ctx.channelService.setup(m => m.getDmChannelId(bbctx, userId)).verifiable(1).thenResolve(channelId);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: 'Hello!' })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                const channelId = randomUUID();
                user.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user')).verifiable(1).thenResolve(user.instance);
                ctx.channelService.setup(m => m.getDmChannelId(bbctx, userId)).verifiable(1).thenResolve(channelId);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ embeds: [{ title: 'Hi!' }] })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                const channelId = randomUUID();
                user.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user')).verifiable(1).thenResolve(user.instance);
                ctx.channelService.setup(m => m.getDmChannelId(bbctx, userId)).verifiable(1).thenResolve(channelId);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                const channelId = randomUUID();
                user.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user')).verifiable(1).thenResolve(user.instance);
                ctx.channelService.setup(m => m.getDmChannelId(bbctx, userId)).verifiable(1).thenResolve(channelId);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                const channelId = randomUUID();
                user.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user')).verifiable(5).thenResolve(user.instance);
                ctx.channelService.setup(m => m.getDmChannelId(bbctx, userId)).verifiable(5).thenResolve(channelId);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: 'Hi!' })))
                    .verifiable(x => x.times(5))
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                const channelId = randomUUID();
                user.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user')).verifiable(6).thenResolve(user.instance);
                ctx.channelService.setup(m => m.getDmChannelId(bbctx, userId)).verifiable(6).thenResolve(channelId);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(2)
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
                ctx.messageService.setup(m => m.create(bbctx, channelId, argument.isDeepEqual({ content: 'Hi!' })))
                    .verifiable(x => x.times(6))
                    .thenResolve(ctx.createMock<Entities.Message>().instance);
            }
        }
    ]
});
