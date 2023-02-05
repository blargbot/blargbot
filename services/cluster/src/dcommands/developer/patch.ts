import { CommandType } from '@blargbot/cluster/utils/index.js';
import { isGuildChannel, isTextableChannel } from '@blargbot/discord-util';
import { util } from '@blargbot/formatting';
import * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.patch;

export class PatchCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'patch',
            category: CommandType.DEVELOPER,
            flags: [
                { flag: 'f', word: 'fixes', description: cmd.flags.fixes },
                { flag: 'n', word: 'notes', description: cmd.flags.notes }
            ],
            definitions: [
                {
                    parameters: '{features+?}',
                    description: cmd.default.description,
                    execute: (ctx, [features], flags) => this.patch(ctx, features.asOptionalString, flags.f?.merge().raw, flags.n?.merge().raw)
                }
            ]
        });
    }

    public async patch(context: CommandContext, features: string | undefined, fixes: string | undefined, notes: string | undefined): Promise<CommandResult> {
        const channel = await context.util.getChannel(context.config.discord.channels.changelog);
        if (channel === undefined || !isGuildChannel(channel) || !isTextableChannel(channel))
            return cmd.default.changelogMissing;

        if (features === undefined && fixes === undefined && notes === undefined)
            return cmd.default.messageEmpty;

        const role = await context.util.getRole(channel.guild, context.config.discord.roles.updates);
        const version = await context.cluster.version.getVersion();
        const embed = {
            author: { name: cmd.default.embed.author.name({ version }) },
            title: features === undefined ? undefined : cmd.default.embed.title,
            description: util.literal(features),
            fields: [
                ...fixes === undefined ? [] : [{
                    name: cmd.default.embed.field.bugFixes.name,
                    value: util.literal(fixes)
                }],
                ...notes === undefined ? [] : [{
                    name: cmd.default.embed.field.otherNotes.name,
                    value: util.literal(notes)
                }]
            ],
            color: 0x2df952
        };

        const confirmed = await context.queryConfirm({
            prompt: {
                content: cmd.default.confirm.prompt,
                embeds: [embed]
            },
            continue: cmd.default.confirm.continue,
            cancel: cmd.default.confirm.cancel
        });

        if (confirmed !== true)
            return cmd.default.cancelled;

        const changelog = await context.send(channel, {
            content: util.literal(role?.mention),
            embeds: [embed],
            allowedMentions: {
                roles: role === undefined ? undefined : [role.id]
            }
        });

        if (changelog === undefined)
            return cmd.default.failed;

        if (changelog.channel.type === Eris.Constants.ChannelTypes.GUILD_NEWS)
            await changelog.crosspost();

        return cmd.default.success;
    }
}
