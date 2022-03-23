import { ChannelNotFoundError, InvalidChannelError } from '@blargbot/bbtag/errors';
import { ArchivedThreadsSubtag } from '@blargbot/bbtag/subtags/thread/archivedthreads';
import { ChannelType } from 'discord-api-types/v9';
import { PublicThreadChannel, VoiceChannel } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ArchivedThreadsSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{archivedthreads}',
            expected: '[]',
            setup(ctx) {
                ctx.discord.setup(m => m.getArchivedThreads(ctx.channels.command.id, 'public', undefined)).thenResolve({
                    hasMore: false,
                    members: [],
                    threads: []
                });
            }
        },
        {
            code: '{archivedthreads}',
            expected: '["2349823947638497","394875398475475957","349857380950645734"]',
            setup(ctx) {
                const thread1 = ctx.createMock(PublicThreadChannel);
                const thread2 = ctx.createMock(PublicThreadChannel);
                const thread3 = ctx.createMock(PublicThreadChannel);

                thread1.setup(m => m.id).thenReturn('2349823947638497');
                thread2.setup(m => m.id).thenReturn('394875398475475957');
                thread3.setup(m => m.id).thenReturn('349857380950645734');

                ctx.discord.setup(m => m.getArchivedThreads(ctx.channels.command.id, 'public', undefined)).thenResolve({
                    hasMore: false,
                    members: [],
                    threads: [
                        thread1.instance,
                        thread2.instance,
                        thread3.instance
                    ]
                });
            }
        },
        {
            code: '{archivedthreads;329876424623746234}',
            expected: '["2349823947638497","394875398475475957","349857380950645734"]',
            setup(ctx) {
                ctx.channels.general.id = '329876424623746234';

                const thread1 = ctx.createMock(PublicThreadChannel);
                const thread2 = ctx.createMock(PublicThreadChannel);
                const thread3 = ctx.createMock(PublicThreadChannel);

                thread1.setup(m => m.id).thenReturn('2349823947638497');
                thread2.setup(m => m.id).thenReturn('394875398475475957');
                thread3.setup(m => m.id).thenReturn('349857380950645734');

                ctx.discord.setup(m => m.getArchivedThreads('329876424623746234', 'public', undefined)).thenResolve({
                    hasMore: false,
                    members: [],
                    threads: [
                        thread1.instance,
                        thread2.instance,
                        thread3.instance
                    ]
                });
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);
                if (channel === undefined)
                    throw new Error('Failed to find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '329876424623746234')).thenResolve([channel]);
            }
        },
        {
            code: '{archivedthreads;329876424623746234}',
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 36, error: new ChannelNotFoundError('329876424623746234') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '329876424623746234')).thenResolve([]);
            }
        },
        {
            code: '{archivedthreads;329876424623746234}',
            expected: '`Channel cannot be a voice channel`',
            errors: [
                { start: 0, end: 36, error: new InvalidChannelError(ChannelType.GuildVoice, '329876424623746234') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock(VoiceChannel);
                channel.setup(m => m.type).thenReturn(ChannelType.GuildVoice);
                channel.setup(m => m.id).thenReturn('329876424623746234');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '329876424623746234')).thenResolve([channel.instance]);
            }
        }
    ]
});
