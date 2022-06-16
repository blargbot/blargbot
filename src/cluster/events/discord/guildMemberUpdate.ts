import { Cluster } from '@blargbot/cluster';
import { guard } from '@blargbot/cluster/utils';
import { DiscordEventService } from '@blargbot/core/serviceTypes';
import { Member, OldMember } from 'eris';
import moment from 'moment-timezone';

export class DiscordMemberUpdateHandler extends DiscordEventService<'guildMemberUpdate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildMemberUpdate', cluster.logger, (_, member, oldMember) => this.execute(member, oldMember));
    }

    public async execute(member: Member, oldMember: OldMember | null): Promise<void> {
        if (member.id === this.cluster.discord.user.id)
            return;

        const promises: Array<Promise<unknown>> = [this.cluster.database.users.upsert(member.user)];
        if (!guard.hasValue(oldMember)) {
            await Promise.all(promises);
            return;
        }

        if (oldMember.nick !== member.nick)
            promises.push(this.cluster.moderation.eventLog.nicknameUpdated(member, oldMember.nick ?? undefined));

        if (member.communicationDisabledUntil !== oldMember.communicationDisabledUntil) {
            if (member.communicationDisabledUntil !== null) {
                const now = moment();
                const memberTimeoutEndDate = moment(member.communicationDisabledUntil);
                const duration = moment.duration(memberTimeoutEndDate.diff(now));

                promises.push(this.cluster.moderation.timeouts.userTimedOut(member.guild, member.user, duration));
                promises.push(this.cluster.moderation.eventLog.userTimedOut(member));
            } else {
                promises.push(this.cluster.moderation.timeouts.userUnTimedOut(member.guild, member.user));
                promises.push(this.cluster.moderation.eventLog.userUnTimedOut(member));
            }
        }

        for (const pair of join(member.roles, oldMember.roles)) {
            if (pair[0] === pair[1])
                continue;

            if (pair[0] === undefined)
                promises.push(this.cluster.moderation.eventLog.roleRemoved(member, pair[1]));
            if (pair[1] === undefined)
                promises.push(this.cluster.moderation.eventLog.roleAdded(member, pair[0]));
        }

        await Promise.all(promises);
    }
}

function* join<T>(left: Iterable<T>, right: Iterable<T>): Iterable<[T, T] | [T, undefined] | [undefined, T]> {
    const rightSet = new Set(right);

    for (const item of left) {
        if (rightSet.delete(item))
            yield [item, item];
        else
            yield [item, undefined];
    }

    for (const item of rightSet)
        yield [undefined, item];
}
