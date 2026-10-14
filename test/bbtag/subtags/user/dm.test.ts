import { UserNotFoundError } from '@blargbot/bbtag';
import { DMSubtag, EscapeBBTagSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new DMSubtag(),
    argCountBounds: { min: 2, max: 3 },
    names: ['dm'],
    cases: [
        {
            code: '{dm;aaaa;{eval}}',
            expected: '`No user found`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 0, end: 16, error: new UserNotFoundError('aaaa') }
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
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                const channel = ctx.createMock<eris.PrivateChannel>();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves(null!);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: 'Hello!' })))
                    .mustHappen(1)
                    .resolves(null!);
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                const channel = ctx.createMock<eris.PrivateChannel>();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves(null!);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ embeds: [{ title: 'Hi!' }] })))
                    .mustHappen(1)
                    .resolves(null!);
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                const channel = ctx.createMock<eris.PrivateChannel>();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves(null!);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] })))
                    .mustHappen(1)
                    .resolves(null!);
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                const channel = ctx.createMock<eris.PrivateChannel>();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves(null!);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] })))
                    .mustHappen(1)
                    .resolves(null!);
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                const channel = ctx.createMock<eris.PrivateChannel>();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(5)
                    .resolves([member.instance]);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(1)
                    .resolves(null!);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: 'Hi!' })))
                    .mustHappen(5)
                    .resolves(null!);
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock<eris.Member>();
                const user = ctx.createMock<eris.User>();
                const channel = ctx.createMock<eris.PrivateChannel>();
                member.setup(m => m.id).returns(ctx.users.other.id);
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.getDMChannel()).resolves(channel.instance);

                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(6)
                    .resolves([member.instance]);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .mustHappen(2)
                    .resolves(null!);
                ctx.util.setup((m, $) => m.send(channel.instance, $({ content: 'Hi!' })))
                    .mustHappen(6)
                    .resolves(null!);
            }
        }
    ]
});
