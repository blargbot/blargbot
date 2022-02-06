import { UserNotFoundError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { DMSubtag } from '@cluster/subtags/user/dm';
import { Guild, Member } from 'eris';

import { argument, Mock } from '../../../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

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
                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'aaaa'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{dm;other user;Hello!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Member);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.sendDM(member.instance, `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):`))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.sendDM(member.instance, argument.isDeepEqual({ content: 'Hello!' })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Member);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.sendDM(member.instance, `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):`))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.sendDM(member.instance, argument.isDeepEqual({ embeds: [{ title: 'Hi!' }] })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Member);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.sendDM(member.instance, `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):`))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.sendDM(member.instance, argument.isDeepEqual({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Member);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.sendDM(member.instance, `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):`))
                    .verifiable(1)
                    .thenResolve();
                ctx.util.setup(m => m.sendDM(member.instance, argument.isDeepEqual({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = ctx.createMock(Member);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(x => x.times(5))
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.sendDM(member.instance, `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):`))
                    .verifiable(x => x.times(1))
                    .thenResolve();
                ctx.util.setup(m => m.sendDM(member.instance, argument.isDeepEqual({ content: 'Hi!' })))
                    .verifiable(x => x.times(5))
                    .thenResolve();
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const member = new Mock(Member);
                member.setup(x => x.id).thenReturn(ctx.users.other.id);

                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(x => x.times(6))
                    .thenResolve([member.instance]);
                ctx.util.setup(m => m.sendDM(member.instance, `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):`))
                    .verifiable(x => x.times(2))
                    .thenResolve();
                ctx.util.setup(m => m.sendDM(member.instance, argument.isDeepEqual({ content: 'Hi!' })))
                    .verifiable(x => x.times(6))
                    .thenResolve();
            }
        }
    ]
});
