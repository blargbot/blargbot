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
        if (await context.queryConfirm({
            prompt: cmd.reset.confirm.prompt,
            cancel: {
                style: Constants.ButtonStyles.SECONDARY,
                label: cmd.reset.confirm.cancel
            },
            continue: {
                style: Constants.ButtonStyles.DANGER,
                label: cmd.reset.confirm.continue
            }
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
