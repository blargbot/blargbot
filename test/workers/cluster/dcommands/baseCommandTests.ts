import { Cluster } from '@cluster';
import { BaseCommand, CommandContext } from '@cluster/command';
import { HelpManager } from '@cluster/managers';
import { CommandResult } from '@cluster/types';
import { Channel } from 'diagnostics_channel';
import { TextBasedChannels, User } from 'discord.js';
import { it } from 'mocha';
import { instance, mock, verify, when } from 'ts-mockito';

interface HandleConfig<TChannel extends TextBasedChannels['type'], AutoMock extends Record<string, unknown>> {
    arrange?: (context: HandleContext<TChannel, AutoMock>) => Awaitable<void>;
    assert?: (context: HandleContext<TChannel, AutoMock>) => Awaitable<void>;
}

type HandleContext<TChannel extends TextBasedChannels['type'], AutoMock extends Record<string, unknown>> =
    & {
        contextMock: CommandContext;
        channelMock: Extract<TextBasedChannels, { type: TChannel; }>;
    } & {
        [P in keyof AutoMock]: AutoMock[P] extends abstract new (...args: infer _) => infer R ? R : Exclude<AutoMock[P], undefined>
    }

export function testExecuteHelp(command: BaseCommand, pages?: number[]): void {
    for (const page of [undefined, 1, ...pages ?? []]) {
        const commandArgs = `help${page === undefined ? '' : ` ${page}`}`;

        testExecute(command, commandArgs, 'This is the help text!', ['GUILD_TEXT'], {
            helpMock: HelpManager,
            clusterMock: Cluster,
            userMock: User
        }, {
            arrange(ctx) {
                when(ctx.contextMock.author)
                    .thenReturn(instance(ctx.userMock));
                when(ctx.contextMock.channel)
                    .thenReturn(instance(ctx.channelMock));
                when(ctx.contextMock.cluster)
                    .thenReturn(instance(ctx.clusterMock));
                when(ctx.contextMock.prefix)
                    .thenReturn('PREFIXAAAAA');
                when(ctx.clusterMock.help)
                    .thenReturn(instance(ctx.helpMock));
                when(ctx.helpMock.viewCommand(instance(ctx.channelMock), instance(ctx.userMock), 'PREFIXAAAAA', command.name, (page ?? 1) - 1))
                    .thenResolve('This is the help text!');
            }
        });
    }
}

export function testExecute<TChannel extends TextBasedChannels['type'], AutoMock extends Record<string, unknown>>(
    command: BaseCommand,
    argumentString: string,
    expected: CommandResult,
    channelTypes: TChannel[],
    automock?: AutoMock,
    options?: HandleConfig<TChannel, AutoMock>
): void {
    for (const channelType of channelTypes) {
        const commandCall = `b!${command.name}${argumentString.length > 0 ? ` ${argumentString}` : ''}`;
        it(`Should handle '${commandCall}' in a ${channelType} channel`, async () => {
            // arrange
            const context = <HandleContext<TChannel, AutoMock>>Object.fromEntries([
                ['channelMock', mock(Channel)] as const,
                ['contextMock', mock(CommandContext)] as const,
                ...Object.entries(automock ?? {})
                    .map(e => [e[0], mock(e[1])] as const)
            ]);

            when(context.channelMock.type).thenReturn(channelType);
            when(context.contextMock.argsString).thenReturn(argumentString);
            when(context.contextMock.channel).thenReturn(instance(context.channelMock));
            when(context.contextMock.reply(expected)).thenResolve(undefined);

            await options?.arrange?.(context);

            // act
            await command.execute(instance(context.contextMock));

            // assert
            verify(context.contextMock.reply(expected)).once();
            await options?.assert?.(context);
        });
    }
}
