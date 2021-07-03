import { BaseGlobalCommand, commandTypes, CommandContext, randInt } from '../core';

export class PingCommand extends BaseGlobalCommand {
    public constructor() {
        super({
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
        const content = messages[randInt(0, messages.length - 1)];
        const message = await context.reply(content);
        if (message !== undefined) {
            await message.edit(`Pong! (${message.timestamp - context.timestamp}ms)`);
        }
    }
}

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
