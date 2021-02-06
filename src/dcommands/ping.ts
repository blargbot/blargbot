import { BaseDCommand } from '../structures/BaseDCommand';
import { randInt, commandTypes } from '../newbu';
import { Message, TextableChannel } from 'eris';
import { Cluster } from '../cluster';

const messages = [
    `Existance is a lie.`,
    `You're going to die some day, perhaps soon.`,
    `Nothing matters.`,
    `Where do you get off?`,
    `There is nothing out there.`,
    `You are all alone in an infinite void.`,
    `Truth is false.`,
    `Forsake everything.`,
    `Your existence is pitiful.`,
    `We are all already dead.`
];

export class PingCommand extends BaseDCommand {
    constructor(cluster: Cluster) {
        super(cluster, 'ping', {
            category: commandTypes.GENERAL,
            usage: 'ping',
            info: 'Pong!\nFind the command latency.'
        });
    }

    async execute(msg: Message<TextableChannel>, words: string[], text: string) {
        let message = messages[randInt(0, messages.length - 1)];
        let msg2 = await this.util.send(msg, message);
        if (msg2)
            await msg2.edit(`Pong! (${msg2.timestamp - msg.timestamp}ms)`);
    }
}