import { CommandType } from '@blargbot/cluster/utils/index.js';

import type { CommandContext } from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.invite;

export class InviteCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'invite',
            aliases: ['join'],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx) => this.invite(ctx)
                }
            ]
        });
    }

    public invite(context: CommandContext): CommandResult {
        return cmd.default.success({
            inviteLink: context.util.websiteLink('invite').toString(),
            guildLink: 'https://discord.gg/015GVxZxI8rtlJgXF'
        });
    }
}
