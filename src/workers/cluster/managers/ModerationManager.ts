import { EmbedField, EmbedOptions, Guild, User } from 'eris';
import { Cluster } from '../Cluster';
import { guard, humanize, ModerationType, WarnResult } from '../core';


export class ModerationManager {
    public constructor(public readonly cluster: Cluster) {
    }

    public async logAction(
        guild: Guild,
        user: User | User[],
        mod?: User,
        type?: string,
        reason?: string,
        color = 0x17c484,
        fields?: EmbedField[]
    ): Promise<void> {
        if (Array.isArray(reason)) reason = reason.join(' ');
        const val = await this.cluster.database.guilds.getSetting(guild.id, 'modlog');
        if (!guard.hasValue(val))
            return;

        const storedGuild = await this.cluster.database.guilds.get(guild.id);
        if (!storedGuild)
            return;

        const caseid = storedGuild.modlog?.length ?? 0;
        const users = Array.isArray(user) ?
            user.map(u => `${u.username}#${u.discriminator} (${u.id})`).join('\n') :
            `${user.username}#${user.discriminator} (${user.id})`;
        reason ??= `Responsible moderator, please do \`reason ${caseid}\` to set.`;
        fields ??= [];

        const embed: EmbedOptions = {
            title: `Case ${caseid}`,
            color: color,
            timestamp: new Date(),
            fields: [
                { name: 'Type', value: type ?? '', inline: true },
                { name: 'Reason', value: reason, inline: true },
                ...fields
            ]
        };
        if (mod) {
            embed.footer = {
                text: `${humanize.fullName(mod)} (${mod.id})`,
                icon_url: mod.avatarURL
            };
        }
        if (Array.isArray(user)) {
            embed.description = users;
        } else {
            embed.author = {
                name: users,
                icon_url: user.avatarURL
            };
        }
        const msg = await this.cluster.util.send(val, {
            embed: embed
        });
        await this.cluster.database.guilds.addModlog(guild.id, {
            caseid: caseid,
            modid: mod?.id,
            msgid: msg?.id ?? '',
            reason: reason,
            type: type ?? 'Generic',
            userid: Array.isArray(user) ? user.map(u => u.id).join(',') : user.id
        });
    }
    public async issueWarning(user: User, guild: Guild, count?: number): Promise<WarnResult> {
        const storedGuild = await this.cluster.database.guilds.get(guild.id);
        if (!storedGuild) throw new Error('Cannot find guild');
        let type = ModerationType.WARN;
        let error: unknown = undefined;
        const oldWarnings = storedGuild.warnings?.users?.[user.id] ?? 0;
        let warningCount: number | undefined = Math.max(0, oldWarnings + (count ?? 1));
        const member = guild.members.get(user.id);
        if (member && this.cluster.util.isBotHigher(member))
            if (storedGuild.settings.banat !== undefined && storedGuild.settings.banat > 0 && warningCount >= storedGuild.settings.banat) {
                this.cluster.util.bans.set(guild.id, user.id, {
                    mod: this.cluster.discord.user,
                    type: 'Auto-Ban',
                    reason: `Exceeded Warning Limit (${warningCount}/${storedGuild.settings.banat})`
                });
                try {
                    await guild.banMember(user.id, 0, `[ Auto-Ban ] Exceeded warning limit (${warningCount}/${storedGuild.settings.banat})`);
                } catch (e: unknown) { error = e; }
                warningCount = undefined;
                type = ModerationType.BAN;
            } else if (storedGuild.settings.kickat !== undefined && storedGuild.settings.kickat > 0 && warningCount >= storedGuild.settings.kickat) {
                try {
                    await guild.kickMember(user.id, `[ Auto-Kick ] Exceeded warning limit (${warningCount}/${storedGuild.settings.kickat})`);
                } catch (e: unknown) { error = e; }
                type = ModerationType.KICK;
            }
        await this.cluster.database.guilds.setWarnings(guild.id, user.id, warningCount);
        return {
            type,
            count: warningCount ?? 0,
            error
        };
    }

    public async issuePardon(user: User, guild: Guild, count?: number): Promise<number> {
        const storedGuild = await this.cluster.database.guilds.get(guild.id);
        if (!storedGuild) throw new Error('Cannot find guild');
        const oldWarnings = storedGuild.warnings?.users?.[user.id] ?? 0;
        const warningCount = Math.max(0, oldWarnings - (count ?? 1));
        await this.cluster.database.guilds.setWarnings(guild.id, user.id, warningCount);
        return warningCount;
    }
}
