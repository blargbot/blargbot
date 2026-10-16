import { UserNotFoundError } from '@blargbot/bbtag';
import type { SendThunk } from '@blargbot/bbtag/subtags';
import { DMSubtag, EscapeBBTagSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const send = new Mock<SendThunk>({ id: 'send', callable: true });

await runSubtagTests({
    subtag: new DMSubtag({
        send: send.instance
    }),
    argCountBounds: { min: 2, max: 3 },
    names: ['dm'],
    setup(ctx) {
        ctx.adoptMock(send);
    },
    cases: [
        {
            code: '{dm;aaaa;{eval}}',
            expected: '`No user found`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { error: new UserNotFoundError('aaaa') }
            ],
            setup(ctx) {
                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'aaaa'))
                    .mustHappen(1)
                    .resolves([]);
            }
        },
        {
            code: '{dm;other user;Hello!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const channel = ctx.createMock<eris.PrivateChannel>({ id: 'channel' });
                const channelId = snowflake.create().toString();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);
                channel.setup(m => m.id).returns(channelId);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                send.setup((m, $) => m(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                send.setup((m, $) => m(channelId, $({ content: 'Hello!', embeds: undefined })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const channel = ctx.createMock<eris.PrivateChannel>({ id: 'channel' });
                const channelId = snowflake.create().toString();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);
                channel.setup(m => m.id).returns(channelId);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                send.setup((m, $) => m(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                send.setup((m, $) => m(channelId, $({ content: undefined, embeds: [{ title: 'Hi!' }] })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const channel = ctx.createMock<eris.PrivateChannel>({ id: 'channel' });
                const channelId = snowflake.create().toString();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);
                channel.setup(m => m.id).returns(channelId);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                send.setup((m, $) => m(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                send.setup((m, $) => m(channelId, $({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const channel = ctx.createMock<eris.PrivateChannel>({ id: 'channel' });
                const channelId = snowflake.create().toString();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);
                channel.setup(m => m.id).returns(channelId);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                send.setup((m, $) => m(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                send.setup((m, $) => m(channelId, $({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const channel = ctx.createMock<eris.PrivateChannel>({ id: 'channel' });
                const channelId = snowflake.create().toString();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);
                channel.setup(m => m.id).returns(channelId);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(5)
                    .resolves([member.instance]);
                send.setup((m, $) => m(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                send.setup((m, $) => m(channelId, $({ content: 'Hi!', embeds: undefined })))
                    .mustHappen(5)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const channel = ctx.createMock<eris.PrivateChannel>({ id: 'channel' });
                const channelId = snowflake.create().toString();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);
                channel.setup(m => m.id).returns(channelId);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(6)
                    .resolves([member.instance]);
                send.setup((m, $) => m(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(2)
                    .resolves({ success: true, id: 'unused' });
                send.setup((m, $) => m(channelId, $({ content: 'Hi!', embeds: undefined })))
                    .mustHappen(6)
                    .resolves({ success: true, id: 'unused' });
            }
        }
    ]
});
