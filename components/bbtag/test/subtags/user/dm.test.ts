import { UserNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';
import { DMSubtag } from '@blargbot/bbtag/subtags/user/dm.js';
import { argument } from '@blargbot/test-util/mock.js';
import * as Eris from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new DMSubtag(),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        {
            code: '{dm;aaaa;{eval}}',
            expected: '`No user found`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 0, end: 16, error: new UserNotFoundError('aaaa') }
            ],
            setup(ctx) {
                ctx.options.rootTagName = 'mySuperCoolTestingTag';
                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Eris.Guild).and(g => g.id === ctx.guild.id).value, 'aaaa'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{dm;other user;Hello!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                const channel = ctx.createMock(Eris.PrivateChannel);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);
                member.setup(x => x.user).thenReturn(user.instance);
                user.setup(m => m.getDMChannel()).thenResolve(channel.instance);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: 'Hello!' })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                const channel = ctx.createMock(Eris.PrivateChannel);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);
                member.setup(x => x.user).thenReturn(user.instance);
                user.setup(m => m.getDMChannel()).thenResolve(channel.instance);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ embeds: [{ title: 'Hi!' }] })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                const channel = ctx.createMock(Eris.PrivateChannel);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);
                member.setup(x => x.user).thenReturn(user.instance);
                user.setup(m => m.getDMChannel()).thenResolve(channel.instance);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                const channel = ctx.createMock(Eris.PrivateChannel);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);
                member.setup(x => x.user).thenReturn(user.instance);
                user.setup(m => m.getDMChannel()).thenResolve(channel.instance);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                const channel = ctx.createMock(Eris.PrivateChannel);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);
                member.setup(x => x.user).thenReturn(user.instance);
                user.setup(m => m.getDMChannel()).thenResolve(channel.instance);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(x => x.times(5))
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(x => x.times(1))
                    .thenResolve();
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: 'Hi!' })))
                    .verifiable(x => x.times(5))
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Eris.Member);
                const user = ctx.createMock(Eris.User);
                const channel = ctx.createMock(Eris.PrivateChannel);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);
                member.setup(x => x.user).thenReturn(user.instance);
                user.setup(m => m.getDMChannel()).thenResolve(channel.instance);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(x => x.times(6))
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
                    .verifiable(x => x.times(2))
                    .thenResolve();
                ctx.util.setup(m => m.send(channel.instance, argument.isDeepEqual({ content: 'Hi!' })))
                    .verifiable(x => x.times(6))
                    .thenResolve();
            }
        }
    ]
});
