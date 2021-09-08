import { CommandContext } from '@cluster/command';
import { PingCommand } from '@cluster/dcommands/general/ping';
import { Channel, Message, TextBasedChannels } from 'discord.js';
import { describe, it } from 'mocha';
import { anyString, instance, mock, verify, when } from 'ts-mockito';

import { testExecute, testExecuteHelp } from '../baseCommandTests';

describe('PingCommand', () => {
    const command = new PingCommand();

    describe('#execute', () => {
        testExecuteHelp(command);

        testExecute(command, '', undefined, ['DM', 'GUILD_NEWS', 'GUILD_NEWS_THREAD', 'GUILD_PRIVATE_THREAD', 'GUILD_PUBLIC_THREAD', 'GUILD_TEXT'],
            {
                replyMock: Message
            },
            {
                arrange(ctx) {
                    when(ctx.contextMock.timestamp).thenReturn(333);
                    when(ctx.replyMock.createdTimestamp).thenReturn(456);
                    when(ctx.contextMock.reply(anyString())).thenResolve(instance(ctx.replyMock));
                    when(ctx.replyMock.edit('✅ Pong! (123ms)')).thenResolve(instance(ctx.replyMock));
                },
                assert(ctx) {
                    verify(ctx.contextMock.reply(anyString())).once();
                    verify(ctx.replyMock.edit('✅ Pong! (123ms)')).once();
                }
            }
        );
    });

    describe('#ping', () => {
        it('Should fail with excess args', async () => {
            // arrange
            const expected = '❌ Too many arguments! `ping` doesnt need any arguments';
            const channelMock = mock<TextBasedChannels>(Channel);
            const contextMock = mock<CommandContext>(CommandContext);
            when(channelMock.type).thenReturn('GUILD_TEXT');
            when(contextMock.argsString).thenReturn('123');
            when(contextMock.channel).thenReturn(instance(channelMock));
            when(contextMock.reply(expected)).thenResolve(undefined);

            // act
            await command.execute(instance(contextMock));

            // assert
            verify(contextMock.reply(expected)).once();
        });

        it('Should edit the message if it is sent successfully', async () => {
            // arrange
            const expected = '✅ Pong! (123ms)';
            const contextMock = mock<CommandContext>(CommandContext);
            const replyMock = mock(Message);
            when(contextMock.reply(anyString())).thenResolve(instance(replyMock));
            when(contextMock.timestamp).thenReturn(333);
            when(replyMock.edit(expected)).thenResolve(instance(replyMock));
            when(replyMock.createdTimestamp).thenReturn(456);

            // act
            await command.ping(instance(contextMock));

            // assert
            verify(contextMock.reply(anyString())).once();
            verify(replyMock.edit(expected)).once();
        });

        it('Should not error if the message doesnt get sent', async () => {
            // arrange
            const contextMock = mock<CommandContext>(CommandContext);
            when(contextMock.reply(anyString())).thenResolve(undefined);

            // act
            await command.ping(instance(contextMock));

            // assert
            verify(contextMock.reply(anyString())).once();
        });
    });
});
