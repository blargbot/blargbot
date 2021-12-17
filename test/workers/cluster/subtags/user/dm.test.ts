import { NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { DMSubtag } from '@cluster/subtags/user/dm';
import { APIGuildMember, ChannelType } from 'discord-api-types';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests, SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

interface DMTestCase extends SubtagTestCase, ReturnType<typeof generateUser> {

}

runSubtagTests<DMSubtag, DMTestCase>({
    subtag: new DMSubtag(),
    setup(ctx) {
        ctx.guild.members.push(this.targetUser);
    },
    cases: [
        {
            code: '{dm}',
            expected: '`Not enough arguments`',
            ...generateUser('0'),
            errors: [
                { start: 0, end: 4, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{dm;{eval}}',
            expected: '`Not enough arguments`',
            ...generateUser('0'),
            errors: [
                { start: 4, end: 10, error: new MarkerError('eval', 4) },
                { start: 0, end: 11, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        {
            code: '{dm;aaaa;{eval}}',
            expected: '`No user found`',
            ...generateUser('0'),
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
            code: '{dm;123456789123456000;Hello!}',
            expected: '',
            ...generateUser('123456789123456000'),
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: this.targetUser.user.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(this.targetUser.user.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hello!' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(this.targetUser.user.id)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: 'Hello!' }), undefined)).once();
            }
        },
        {
            code: '{dm;123456789123456001;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            ...generateUser('123456789123456001'),
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: this.targetUser.user.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(this.targetUser.user.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ embeds: [{ title: 'Hi!' }] }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(this.targetUser.user.id)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ embeds: [{ title: 'Hi!' }] }), undefined)).once();
            }
        },
        {
            code: '{dm;123456789123456001;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            ...generateUser('123456789123456001'),
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: this.targetUser.user.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(this.targetUser.user.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(this.targetUser.user.id)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] }), undefined)).once();
            }
        },
        {
            code: '{dm;123456789123456001;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            ...generateUser('123456789123456001'),
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: this.targetUser.user.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(this.targetUser.user.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(this.targetUser.user.id)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] }), undefined)).once();
            }
        },
        {
            code: '{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}',
            expected: '',
            ...generateUser('123456789123456001'),
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: this.targetUser.user.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(this.targetUser.user.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(this.targetUser.user.id)).times(5);
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).once();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).times(5);
            }
        },
        {
            code: '{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}{dm;123456789123456001;Hi!}',
            expected: '',
            ...generateUser('123456789123456001'),
            setup(ctx) {
                const dmChannel = ctx.createChannel({
                    id: this.targetUser.user.id,
                    type: ChannelType.DM,
                    recipients: [ctx.users.bot]
                });

                ctx.discord.setup(m => m.getDMChannel(this.targetUser.user.id)).thenResolve(dmChannel);
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).thenResolve();
                ctx.discord.setup(m => m.createMessage(dmChannel.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.getDMChannel(this.targetUser.user.id)).times(6);
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: `The following message was sent from **__Test Guild__** (${ctx.guild.id}), and was sent by **__Command User#0000__** (${ctx.users.command.id}):` }), undefined)).twice();
                ctx.discord.verify(m => m.createMessage(this.targetUser.user.id, argument.isDeepEqual({ content: 'Hi!' }), undefined)).times(6);
            }
        },
        {
            code: '{dm;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            ...generateUser('0'),
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

function generateUser(userId: string): { targetUser: RequiredProps<APIGuildMember, 'user'>; } {
    const targetUser = SubtagTestContext.createApiGuildMember({}, SubtagTestContext.createApiUser({
        id: userId,
        username: 'bannable user',
        discriminator: '0001'
    }));

    return { targetUser };
}
