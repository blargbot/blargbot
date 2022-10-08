import { bot } from '@blargbot/bbtag/subtags/index';
import { TagVariableType } from '@blargbot/domain/models';
import { Constants } from 'eris';

import { GuildCommand } from '../../command';
import templates from '../../text';
import { CommandResult, GuildCommandContext } from '../../types';
import { CommandType } from '../../utils';

const cmd = templates.commands.bot;

export class ServerCommand extends GuildCommand {
    public constructor() {
        super({
            name: `bot`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `reset`,
                    description: cmd.reset.description,
                    execute: (ctx) => this.resetGuild(ctx)
                }
            ]
        });
    }

    public async resetGuild(context: GuildCommandContext): Promise<CommandResult> {
        if (await context.util.queryConfirm({
            context: context.message,
            actors: context.author,
            prompt: cmd.reset.prompt,
            cancel: { style: Constants.ButtonStyles.SECONDARY, label: `No` },
            confirm: { style: Constants.ButtonStyles.DANGER, label: `Yes` }
        }) !== true) {
            return cmd.reset.cancelled;
        }

        await context.database.guilds.reset(context.channel.guild);
        await context.database.tagVariables.clearScope({ type: TagVariableType.GUILD, entityId: context.channel.guild.id });
        await context.database.tagVariables.clearScope({ type: TagVariableType.TAGGUILD, entityId: context.channel.guild.id });
        await context.database.tagVariables.clearScope({ type: TagVariableType.GUILDLOCAL, entityId: context.channel.guild.id });

        return cmd.reset.success;
    }
}
