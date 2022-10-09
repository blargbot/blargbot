import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.invite;

export class InviteCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `invite`,
            aliases: [`join`],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.default.description,
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
