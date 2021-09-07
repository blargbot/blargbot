import { CommandContext } from '@cluster/command';
import { PingCommand } from '@cluster/dcommands/general/ping';
import { expect } from 'chai';
import { Message } from 'discord.js';
import { describe } from 'mocha';
import { anyString, instance, mock, verify, when } from 'ts-mockito';

describe('PingCommand', () => {
    const command = new PingCommand();

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
        const result = await command.ping(instance(contextMock));

        // assert
        expect(result).to.be.undefined;
        verify(contextMock.reply(anyString())).once();
        verify(replyMock.edit(expected)).once();
    });

    it('Should not error if the message doesnt get sent', async () => {
        // arrange
        const contextMock = mock<CommandContext>(CommandContext);
        when(contextMock.reply(anyString())).thenResolve(undefined);

        // act
        const result = await command.ping(instance(contextMock));

        // assert
        expect(result).to.be.undefined;
        verify(contextMock.reply(anyString())).once();
    });
});
