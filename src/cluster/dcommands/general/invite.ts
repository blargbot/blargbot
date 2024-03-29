import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

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
            inviteLink: context.util.websiteLink('invite'),
            guildLink: 'https://discord.gg/015GVxZxI8rtlJgXF'
        });
    }
}
