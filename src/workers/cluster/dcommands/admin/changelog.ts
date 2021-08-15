import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { guard, humanize } from '@core/utils';
import { Webhook } from 'discord.js';

export class ChangelogCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'changelog',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'subscribe|sub|track',
                    description: 'Subscribes this channel to my changelog updates. I require the `manage webhooks` permission for this.',
                    execute: (ctx) => this.addFollower(ctx)
                },
                {
                    parameters: 'unsubscribe|unsub|untrack',
                    description: 'Unsubscribes this channel from my changelog updates. I require the `manage webhooks` permission for this.',
                    execute: (ctx) => this.removeFollower(ctx)
                }
            ]
        });
    }

    public async addFollower(context: GuildCommandContext): Promise<string> {
        const current = await this.getCurrentSubscription(context);
        if (typeof current !== 'undefined')
            return this.info('This channel is already subscribed to my changelog updates!');

        const changelogChannel = await context.util.getChannel(context.config.discord.channels.changelog);
        if (changelogChannel === undefined || !guard.isGuildChannel(changelogChannel) || changelogChannel.type !== 'GUILD_NEWS')
            return this.error('It looks like I cant find the where to get changelog messages from! Please try again later.');

        await changelogChannel.addFollower(context.channel, `${humanize.fullName(context.author)} subscribed channel to changelog updates`);
        return this.success('This channel will now get my changelog updates!');
    }

    public async removeFollower(context: GuildCommandContext): Promise<string> {
        const current = await this.getCurrentSubscription(context);
        if (typeof current !== 'object')
            return current ?? this.info('This channel is not subscribed to my changelog updates!');

        await current.delete(`${humanize.fullName(context.author)} unsubscribed channel to changelog updates`);
        return this.success('This channel will no longer get my changelog updates!');
    }

    private async getCurrentSubscription(context: GuildCommandContext): Promise<Webhook | string | undefined> {
        if (context.channel.guild.me?.permissions.has('MANAGE_WEBHOOKS') !== true)
            return this.error('I need the manage webhooks permission to subscribe this channel to changelogs!');

        const webhooks = await context.channel.guild.fetchWebhooks();
        return webhooks.find(hook =>
            hook.sourceChannel?.id === context.config.discord.channels.changelog
            && hook.channelId === context.channel.id
        );
    }
}
