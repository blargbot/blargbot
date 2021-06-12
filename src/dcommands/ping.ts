import { BaseCommand, CommandContext } from '../core/command';
import { randInt, commandTypes } from '../utils';
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

export class PingCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'ping',
            category: commandTypes.GENERAL,
            info: 'Pong!\nFind the command latency.',
            definition: {
                parameters: '',
                execute: ctx => this.ping(ctx),
                description: 'Gets the current latency.'
            }
        });
    }

    private async ping(context: CommandContext): Promise<void> {
        const message = messages[randInt(0, messages.length - 1)];
        const msg2 = await this.util.send(context, message);
        if (msg2)
            await msg2.edit(`Pong! (${msg2.timestamp - context.timestamp}ms)`);
    }
}