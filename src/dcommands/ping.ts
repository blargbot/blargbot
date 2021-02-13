import { BaseDCommand } from '../structures/BaseDCommand';
import { randInt, commandTypes } from '../utils';
import { Message, TextableChannel } from 'eris';
import { Cluster } from '../cluster';

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

export class PingCommand extends BaseDCommand {
    public constructor(cluster: Cluster) {
        super(cluster, 'ping', {
            category: commandTypes.GENERAL,
            usage: 'ping',
            info: 'Pong!\nFind the command latency.'
        });
    }

    public async execute(msg: Message<TextableChannel>): Promise<void> {
        const message = messages[randInt(0, messages.length - 1)];
        const msg2 = await this.send(msg, message);
        if (msg2)
            await msg2.edit(`Pong! (${msg2.timestamp - msg.timestamp}ms)`);
    }
}