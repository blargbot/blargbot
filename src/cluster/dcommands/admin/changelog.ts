import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { humanize } from '@blargbot/core/utils';
import { Webhook } from 'eris';

export class ChangelogCommand extends GuildCommand {
    public constructor() {
        super({
            name: `changelog`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `subscribe|sub|track`,
                    description: `Subscribes this channel to my changelog updates. I require the \`manage webhooks\` permission for this.`,
                    execute: (ctx) => this.addFollower(ctx)
                },
                {
                    parameters: `unsubscribe|unsub|untrack`,
                    description: `Unsubscribes this channel from my changelog updates. I require the \`manage webhooks\` permission for this.`,
                    execute: (ctx) => this.removeFollower(ctx)
                }
            ]
        });
    }

    public async addFollower(context: GuildCommandContext): Promise<CommandResult> {
        const current = await this.#getCurrentSubscription(context);
        if (typeof current !== `undefined`)
            return `ℹ️ This channel is already subscribed to my changelog updates!`;

        await context.discord.followChannel(context.config.discord.channels.changelog, context.channel.id);
        return `✅ This channel will now get my changelog updates!`;
    }

    public async removeFollower(context: GuildCommandContext): Promise<CommandResult> {
        const current = await this.#getCurrentSubscription(context);
        if (typeof current !== `object`)
            return current ?? `ℹ️ This channel is not subscribed to my changelog updates!`;

        await context.discord.deleteWebhook(current.id, undefined, `${humanize.fullName(context.author)} unsubscribed channel to changelog updates`);
        return `✅ This channel will no longer get my changelog updates!`;
    }

    async #getCurrentSubscription(context: GuildCommandContext): Promise<Webhook | CommandResult> {
        const self = context.channel.guild.members.get(context.discord.user.id);
        if (self?.permissions.has(`manageWebhooks`) !== true)
            return `❌ I need the manage webhooks permission to subscribe this channel to changelogs!`;

        const webhooks = await context.channel.guild.getWebhooks();
        return webhooks.find(hook =>
            hook.source_channel?.id === context.config.discord.channels.changelog
            && hook.channel_id === context.channel.id
        );
    }
}
