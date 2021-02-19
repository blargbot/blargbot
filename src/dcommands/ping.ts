import { BaseCommand } from '../core/command';
import { randInt, commandTypes } from '../utils';
import { Message } from 'eris';
import { Cluster } from '../cluster';
import { CommandHandlerTree } from '../core/command/types';

const messages = [
    'Existance is a lie.',
    'You\'re going to die some day, perhaps soon.',
    'Nothing matters.',
    'Where do you get off?',
    'There is nothing out there.',
    'You are all alone in an infinite void.',
    'Truth is false.',
    'Forsake everything.',
    'Your existence is pitiful.',
    'We are all already dead.'
];

export class PingCommand extends BaseCommand {
    public readonly handlers: CommandHandlerTree<this>;
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'ping',
            category: commandTypes.GENERAL,
            info: 'Pong!\nFind the command latency.'
        });

        this.handlers = {
            _run: message => this.ping(message)
        };
    }

    private async ping(msg: Message): Promise<void> {
        const message = messages[randInt(0, messages.length - 1)];
        const msg2 = await this.util.send(msg, message);
        if (msg2)
            await msg2.edit(`Pong! (${msg2.timestamp - msg.timestamp}ms)`);
    }
}