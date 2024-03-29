import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { util } from '@blargbot/formatting';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.donate;

export class DonateCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'donate',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx) => this.donateDetails(ctx)
                }
            ]
        });
    }

    public async donateDetails(context: CommandContext): Promise<CommandResult> {
        const ownerId = context.cluster.ownerIds.reduce((p, c) => p < c ? p : c);
        const owner = await context.util.getUser(ownerId);
        await context.send(context.author, {
            embeds: [
                {
                    author: owner === undefined ? undefined : context.util.embedifyAuthor(owner),
                    description: cmd.default.embed.description,
                    fields: [
                        {
                            name: cmd.default.embed.field.paypal.name,
                            value: util.literal('https://paypal.me/stupidcat'),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.patreon.name,
                            value: util.literal('https://www.patreon.com/blargbot'),
                            inline: true
                        }
                    ]
                }
            ]
        });
        return cmd.default.success;
    }
}
