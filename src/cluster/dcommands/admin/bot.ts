import { TagVariableType } from '@blargbot/domain/models';
import { Constants } from 'eris';

import { GuildCommand } from '../../command';
import { GuildCommandContext } from '../../types';
import { CommandType } from '../../utils';

export class ServerCommand extends GuildCommand {
    public constructor() {
        super({
            name: `bot`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `reset`,
                    description: `Resets the bot to the state it is in when joining a guild for the first time.`,
                    execute: (ctx) => this.resetGuild(ctx)
                }
            ]
        });
    }

    public async resetGuild(context: GuildCommandContext): Promise<string> {
        if (await context.util.queryConfirm({
            context: context.message,
            actors: context.author,
            prompt: `⚠️ Are you sure you want to reset the bot to its initial state?
This will:
- Reset all settings back to their defaults
- Delete all custom commands, autoresponses, rolemes, censors, etc
- Delete all tag guild variables`,
            cancel: { style: Constants.ButtonStyles.SECONDARY, label: `No` },
            confirm: { style: Constants.ButtonStyles.DANGER, label: `Yes` }
        }) !== true) {
            return `❌ Reset cancelled`;
        }

        await context.database.guilds.reset(context.channel.guild);
        await context.database.tagVariables.clearScope({ type: TagVariableType.GUILD, entityId: context.channel.guild.id });
        await context.database.tagVariables.clearScope({ type: TagVariableType.TAGGUILD, entityId: context.channel.guild.id });
        await context.database.tagVariables.clearScope({ type: TagVariableType.GUILDLOCAL, entityId: context.channel.guild.id });

        return `✅ I have been reset back to my initial configuration`;
    }
}
