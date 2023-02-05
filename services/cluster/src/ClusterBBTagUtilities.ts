import type { BBTagContext, BBTagUtilities, Entities } from '@blargbot/bbtag';
import { util } from '@blargbot/formatting';
import moment from 'moment-timezone';

import type { Cluster } from './Cluster.js';

export class ClusterBBTagUtilities implements BBTagUtilities {
    public get defaultPrefix(): string {
        return this.cluster.config.discord.defaultPrefix;
    }

    public constructor(public readonly cluster: Cluster) {
    }

    public async generateDumpPage(payload: Entities.MessageCreateOptions, channel: Entities.Channel): Promise<string> {
        // @ts-expect-error This is only a reference file for now
        return (await this.cluster.util.generateDumpPage(payload, channel)).toString();
    }

    public websiteLink(path?: string | undefined): string {
        return this.cluster.util.websiteLink(path);
    }

    public timeout(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, duration: moment.Duration, reason?: string | undefined): Promise<'noPerms' | 'success' | 'alreadyTimedOut' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.moderation.timeouts.timeout(member, moderator, authorizer, duration, util.literal(reason));
    }

    public clearTimeout(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string | undefined): Promise<'noPerms' | 'success' | 'moderatorNoPerms' | 'notTimedOut'> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.moderation.timeouts.clearTimeout(member, moderator, authorizer, util.literal(reason));
    }

    public addModLog(guild: Entities.Guild, action: string, user: Entities.User, moderator?: Entities.User, reason?: string, color?: number): Promise<void> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.moderation.modLog.logCustom(guild, util.literal(action), user, moderator, util.literal(reason), color);
    }

    public canRequestDomain(domain: string): boolean {
        return this.cluster.domains.isWhitelisted(domain);
    }

    public isUserStaff(member: Entities.User): Promise<boolean> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.util.isUserStaff(member);
    }

    public async warn(member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        // @ts-expect-error This is only a reference file for now
        const result = await this.cluster.moderation.warns.warn(member, moderator, this.cluster.discord.user, count, util.literal(reason));
        return result.warnings;
    }

    public async pardon(member: Entities.User, moderator: Entities.User, count: number, reason?: string): Promise<number> {
        // @ts-expect-error This is only a reference file for now
        const result = await this.cluster.moderation.warns.pardon(member, moderator, count, util.literal(reason));
        return result.warnings;
    }

    public ban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, deleteDays: number, reason: string, duration: moment.Duration): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.moderation.bans.ban(guild, user, moderator, authorizer, deleteDays, util.literal(reason), duration);
    }

    public unban(guild: Entities.Guild, user: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'noPerms' | 'moderatorNoPerms' | 'notBanned'> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.moderation.bans.unban(guild, user, moderator, authorizer, util.literal(reason));
    }

    public kick(member: Entities.User, moderator: Entities.User, authorizer: Entities.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        // @ts-expect-error This is only a reference file for now
        return this.cluster.moderation.bans.kick(member, moderator, authorizer, util.literal(reason));
    }

    public async setTimeout(context: BBTagContext, content: string, timeout: moment.Duration): Promise<void> {
        await this.cluster.timeouts.insert('tag', {
            version: 4,
            source: context.guild.id,
            channel: context.channel.id,
            endtime: moment().add(timeout).valueOf(),
            context: JSON.stringify(context.serialize()),
            content: content
        });
    }
}
