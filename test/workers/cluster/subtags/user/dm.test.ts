import { NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { DMSubtag } from '@cluster/subtags/user/dm';
import { ChannelType } from 'discord-api-types';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new DMSubtag(),
    cases: [
        {
            code: '{dm}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 4, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{dm;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 4, end: 10, error: new MarkerError('eval', 4) },
                { start: 0, end: 11, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        {
            code: '{dm;aaaa;{eval}}',
            expected: '`No user found`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 0, end: 16, error: new UserNotFoundError('aaaa') }
            ],
            setup(ctx) {
                ctx.options.rootTagName = 'mySuperCoolTestingTag';
                ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `aaaa` found in tag `mySuperCoolTestingTag`.' }), undefined)).thenResolve();
            }
        },
        {
            code: '{dm;other user;Hello!}',
            expected: '',
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: ctx.users.other.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(ctx.users.other.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hello!' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(ctx.users.other.id)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: 'Hello!' }), undefined)).once();
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: ctx.users.other.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(ctx.users.other.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ embeds: [{ title: 'Hi!' }] }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(ctx.users.other.id)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ embeds: [{ title: 'Hi!' }] }), undefined)).once();
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: ctx.users.other.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(ctx.users.other.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(ctx.users.other.id)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] }), undefined)).once();
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: ctx.users.other.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(ctx.users.other.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(ctx.users.other.id)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] }), undefined)).once();
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: ctx.users.other.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(ctx.users.other.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(ctx.users.other.id)).times(5);
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).times(5);
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: ctx.users.other.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(ctx.users.other.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(ctx.users.other.id)).times(6);
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).twice();
                ctx.discord.verify(m => m.createMessage(ctx.users.other.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).times(6);
            }
        },
        {
            code: '{dm;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 4, end: 10, error: new MarkerError('eval', 4) },
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 25, end: 31, error: new MarkerError('eval', 25) },
                { start: 0, end: 32, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
