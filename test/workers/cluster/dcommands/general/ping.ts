import { Cluster } from '@cluster';
import { BaseCommand, CommandContext } from '@cluster/command';
import { HelpCommand } from '@cluster/dcommands/general/help';
import { PingCommand } from '@cluster/dcommands/general/ping';
import { AggregateCommandManager, DefaultCommandManager } from '@cluster/managers';
import { ICommand } from '@cluster/types';
import { Channel, Message, TextBasedChannels, User } from 'discord.js';
import { describe } from 'mocha';
import { anyString, instance, mock, verify, when } from 'ts-mockito';

describe('PingCommand', () => {
    const command = new PingCommand();

    it('Should handle no args', async () => {
        // arrange
        const expected = '✅ Pong! (123ms)';
        const channelMock = mock<TextBasedChannels>(Channel);
        const contextMock = mock<CommandContext>(CommandContext);
        const replyMock = mock(Message);
        when(channelMock.type).thenReturn('GUILD_TEXT');
        when(contextMock.argsString).thenReturn('');
        when(contextMock.channel).thenReturn(instance(channelMock));
        when(contextMock.reply(anyString())).thenResolve(instance(replyMock));
        when(contextMock.reply(undefined)).thenResolve(undefined);
        when(contextMock.timestamp).thenReturn(333);
        when(replyMock.edit(expected)).thenResolve(instance(replyMock));
        when(replyMock.createdTimestamp).thenReturn(456);

        // act
        await command.execute(instance(contextMock));

        // assert
        verify(contextMock.reply(anyString())).once();
        verify(contextMock.reply(undefined)).once();
        verify(replyMock.edit(expected)).once();
    });

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

    it('Should pass with help temp', async () => {
        // arrange
        const expected = 'This is the help text!';
        const channelMock = mock<TextBasedChannels>(Channel);
        const contextMock = mock<CommandContext>(CommandContext);
        const helpCommandMock = mock<ICommand<BaseCommand>>();
        const helpMock = mock(HelpCommand);
        const clusterMock = mock(Cluster);
        const commandsMock = mock(AggregateCommandManager);
        const defaultCommandsMock = mock(DefaultCommandManager);
        const userMock = mock(User);
        when(channelMock.type).thenReturn('GUILD_TEXT');
        when(contextMock.argsString).thenReturn('help');
        when(contextMock.author).thenReturn(instance(userMock));
        when(contextMock.channel).thenReturn(instance(channelMock));
        when(contextMock.cluster).thenReturn(instance(clusterMock));
        when(contextMock.reply(expected)).thenResolve(undefined);
        when(clusterMock.commands).thenReturn(instance(commandsMock));
        when(commandsMock.default).thenReturn(instance(defaultCommandsMock));
        when(defaultCommandsMock.get('help', instance(channelMock), instance(userMock))).thenResolve({ state: 'ALLOWED', detail: instance(helpCommandMock) });
        when(helpCommandMock.implementation).thenReturn(instance(helpMock));
        when(helpMock.viewCommand(instance(contextMock), 'ping', 0, undefined)).thenResolve(expected);

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
