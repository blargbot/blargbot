import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { IFormattable, util } from '@blargbot/formatting';
import * as Eris from 'eris';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.changeLog;

export class ChangelogCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'changelog',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'subscribe|sub|track',
                    description: cmd.subscribe.description,
                    execute: (ctx) => this.addFollower(ctx)
                },
                {
                    parameters: 'unsubscribe|unsub|untrack',
                    description: cmd.unsubscribe.description,
                    execute: (ctx) => this.removeFollower(ctx)
                }
            ]
        });
    }

    public async addFollower(context: GuildCommandContext): Promise<CommandResult> {
        const current = await this.#getCurrentSubscription(context);
        if (current === undefined)
            return cmd.subscribe.alreadySubscribed;
        if (util.isFormattable(current))
            return current;

        await context.discord.followChannel(context.config.discord.channels.changelog, context.channel.id);
        return cmd.subscribe.success;
    }

    public async removeFollower(context: GuildCommandContext): Promise<CommandResult> {
        const current = await this.#getCurrentSubscription(context);
        if (current === undefined)
            return cmd.unsubscribe.notSubscribed;
        if (util.isFormattable(current))
            return current;

        await context.discord.deleteWebhook(current.id, undefined, `${context.author.username}#${context.author.discriminator} unsubscribed channel to changelog updates`);
        return cmd.unsubscribe.success;
    }

    async #getCurrentSubscription(context: GuildCommandContext): Promise<Eris.Webhook | IFormattable<string> | undefined> {
        const self = context.channel.guild.members.get(context.discord.user.id);
        if (self?.permissions.has('manageWebhooks') !== true)
            return cmd.errors.missingPermissions;

        const webhooks = await context.channel.guild.getWebhooks();
        return webhooks.find(hook =>
            hook.source_channel?.id === context.config.discord.channels.changelog
            && hook.channel_id === context.channel.id
        );
    }
}
