import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import { CommandResult } from '../../types';

export class InviteCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `invite`,
            aliases: [`join`],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Gets you invite information.`,
                    execute: (ctx) => this.invite(ctx)
                }
            ]
        });
    }

    public invite(context: CommandContext): CommandResult {
        return [
            `Invite me to your guild!`,
            `<${context.util.websiteLink(`invite`)}>`,
            `Join my support guild!`,
            `https://discord.gg/015GVxZxI8rtlJgXF\``
        ].join(`\n`);
    }
}
