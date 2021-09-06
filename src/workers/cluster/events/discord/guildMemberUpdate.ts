import { Cluster } from '@cluster';
import { guard } from '@cluster/utils';
import { DiscordEventService } from '@core/serviceTypes';
import { GuildMember, PartialGuildMember } from 'discord.js';

export class DiscordGuildMemberUpdateHandler extends DiscordEventService<'guildMemberUpdate'> {
    public constructor(protected readonly cluster: Cluster) {
        super(cluster.discord, 'guildMemberUpdate', cluster.logger);
    }

    public async execute(oldMember: GuildMember | PartialGuildMember, member: GuildMember): Promise<void> {
        if (member.id === this.cluster.discord.user.id)
            return;

        const promises: Array<Promise<unknown>> = [this.cluster.database.users.upsert(member.user)];
        if (!guard.hasValue(oldMember)) {
            await Promise.all(promises);
            return;
        }

        if (oldMember.nickname !== member.nickname)
            promises.push(this.cluster.moderation.eventLog.nicknameUpdated(member, oldMember.nickname ?? undefined));

        for (const pair of join(member.roles.cache.values(), oldMember.roles.cache.values())) {
            if (pair[0] === pair[1])
                continue;

            if (pair[0] === undefined)
                promises.push(this.cluster.moderation.eventLog.roleRemoved(member, pair[1].id));
            if (pair[1] === undefined)
                promises.push(this.cluster.moderation.eventLog.roleAdded(member, pair[0].id));
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
