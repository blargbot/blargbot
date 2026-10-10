import type { DiscordSendDmLocals } from '@blargbot/bbtag-engine';
import { createEmbedParser, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { MarkerError, runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests<DiscordSendDmLocals>({
    replacer: replacers.dmReplacerFactory({ parseEmbed: createEmbedParser(() => undefined) }),
    names: ['dm'],
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
                ctx.discord.setup((m, $) => m.queryUser('aaaa', $({ throw: UserNotFoundError })))
                    .rejects(new UserNotFoundError('aaaa'))
                    .mustHappen(1);
            }
        },
        {
            code: '{dm;other user;Hello!}',
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const messageId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup(m => m.sendDM(userId, 'Hello!', undefined)).resolves(messageId).mustHappen(1);
                ctx.locals.setup(m => m.nsfw).returns({ value: null }).mustHappen(1);
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            replacers: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const messageId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup((m, $) => m.sendDM(userId, undefined, $.looksLike([{ title: 'Hi!' }]))).resolves(messageId).mustHappen(1);
                ctx.locals.setup(m => m.nsfw).returns({ value: null }).mustHappen(1);
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            replacers: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const messageId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup((m, $) => m.sendDM(userId, 'Hello there!', $.looksLike([{ title: 'General Kenobi!' }]))).resolves(messageId).mustHappen(1);
                ctx.locals.setup(m => m.nsfw).returns({ value: null }).mustHappen(1);
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            replacers: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const messageId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup((m, $) => m.sendDM(
                    userId,
                    '{ "title": "this isnt actually an embed" }',
                    $.looksLike([{ title: 'General Kenobi!' }])
                )).resolves(messageId).mustHappen(1);
                ctx.locals.setup(m => m.nsfw).returns({ value: null }).mustHappen(1);
            }
        },
        {
            code: '{dm;other user;Something edgy}',
            replacers: [replacers.escapeBBTagReplacer],
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const messageId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup(m => m.sendDM(userId, 'No nsfw in dms', undefined)).resolves(messageId).mustHappen(1);
                ctx.locals.setup(m => m.nsfw).returns({ value: 'No nsfw in dms' }).mustHappen(1);
            }
        }
        // TODO migrate this once dms are implemented.
        // {
        //     code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
        //     expected: '',
        //     setup(ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         const channel = ctx.createMock(eris.PrivateChannel);
        //         member.setup(x => x.id).returns(ctx.users.other.id);
        //         member.setup(x => x.user).returns(user.instance);
        //         user.setup(m => m.getDMChannel()).resolves(channel.instance);

        //         ctx.util.setup(m => m.findMembers($.isInstanceof(eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
        //             .verifiable(x => x.times(5))
        //             .thenResolve([member.instance]);
        //         ctx.util.setup(m => m.send(channel.instance, $.looksLike({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
        //             .verifiable(x => x.times(1))
        //             .thenResolve();
        //         ctx.util.setup(m => m.send(channel.instance, $.looksLike({ content: 'Hi!' })))
        //             .verifiable(x => x.times(5))
        //             .thenResolve();
        //     }
        // },
        // {
        //     code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
        //     expected: '',
        //     setup(ctx) {
        //         const member = ctx.createMock(eris.Member);
        //         const user = ctx.createMock(eris.User);
        //         const channel = ctx.createMock(eris.PrivateChannel);
        //         member.setup(x => x.id).returns(ctx.users.other.id);
        //         member.setup(x => x.user).returns(user.instance);
        //         user.setup(m => m.getDMChannel()).resolves(channel.instance);

        //         ctx.util.setup(m => m.findMembers($.isInstanceof(eris.Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
        //             .verifiable(x => x.times(6))
        //             .thenResolve([member.instance]);
        //         ctx.util.setup(m => m.send(channel.instance, $.looksLike({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` })))
        //             .verifiable(x => x.times(2))
        //             .thenResolve();
        //         ctx.util.setup(m => m.send(channel.instance, $.looksLike({ content: 'Hi!' })))
        //             .verifiable(x => x.times(6))
        //             .thenResolve();
        //     }
        // }
    ]
});
