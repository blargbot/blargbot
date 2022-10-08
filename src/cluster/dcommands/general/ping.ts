import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randInt } from '@blargbot/cluster/utils';

import { CommandResult } from '../../types';

export class PingCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `ping`,
            category: CommandType.GENERAL,
            description: `Pong!\nFind the command latency.`,
            definitions: [
                {
                    parameters: ``,
                    execute: ctx => this.ping(ctx),
                    description: `Gets the current latency.`
                }
            ]
        });
    }

    public async ping(context: CommandContext): Promise<CommandResult> {
        const content = messages[randInt(0, messages.length - 1)];
        const message = await context.reply(`ℹ️ ${content}`);
        await message?.edit(`✅ Pong! (${message.createdAt - context.timestamp}ms)`);
        return undefined;
    }
}

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
