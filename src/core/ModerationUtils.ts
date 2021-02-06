import { EmbedField, EmbedOptions, Guild, Member, User } from "eris";
import { Cluster } from "../cluster";
import { humanize, ModerationType } from "../newbu";


export class ModerationUtils {
    constructor(
        public readonly cluster: Cluster
    ) {
    }

    async log(guild: Guild, user: User | User[], mod: User, type: string, reason?: string | string[], color?: number, fields?: EmbedField[]) {
        let storedGuild = await this.cluster.util.getGuild(guild.id);
        if (!storedGuild?.settings?.modlog)
            return;

        let caseid = 0;
        if (storedGuild.modlog?.length) {
            caseid = storedGuild.modlog.length;
        }


        if (Array.isArray(reason))
            reason = reason.join(' ');
        reason ??= `Responsible moderator, please do \`reason ${caseid}\` to set.`;
        color ??= 0x17c484;
        fields ??= [];

        let embed: EmbedOptions = {
            title: `Case ${caseid}`,
            color: color,
            fields: [
                {
                    name: 'Type',
                    value: type,
                    inline: true
                }, {
                    name: 'Reason',
                    value: reason,
                    inline: true
                },
                ...fields
            ],
            footer: {
                text: `${humanize.fullName(mod)} (${mod.id})`,
                icon_url: mod.avatarURL
            },
            timestamp: new Date()
        };

        if (Array.isArray(user)) {
            embed.description = user.map(u => `${humanize.fullName(u)} (${u.id})`).join('\n');
        } else {
            embed.author = {
                name: `${humanize.fullName(user)} (${user.id})`,
                icon_url: user.avatarURL
            };
        }

        let msg = await this.cluster.util.send(storedGuild.settings.modlog, { embed: embed });

        const cases = storedGuild.modlog ??= [];
        cases.push({
            caseid: caseid,
            modid: mod ? mod.id : null,
            msgid: msg ? msg.id : '',
            reason: reason || null,
            type: type || 'Generic',
            userid: Array.isArray(user) ? user.map(u => u.id).join(',') : user.id
        });


        await this.cluster.rethinkdb.query(r =>
            r.table('guild')
                .get(guild.id)
                .update({ modlog: cases }));
    }

    async warn(user: User, guild: Guild, count: number = 1) {
        let storedGuild = await this.cluster.util.getGuild(guild.id);
        if (!storedGuild)
            return;

        let type = ModerationType.WARN;
        let warnings = storedGuild.warnings ??= {};
        let users = warnings.users ??= {};
        let warningCount = users[user.id] = (users[user.id] ?? 0) + count;
        if (warningCount < 0)
            warningCount = users[user.id] = count;

        let error = undefined;
        const member = guild.members.get(user.id);
        if (member && this.cluster.util.isBotHigher(member) && storedGuild.settings) {
            if (storedGuild.settings.banat && storedGuild.settings.banat > 0 && warningCount >= storedGuild.settings.banat) {
                type = ModerationType.BAN;
                this.cluster.util.bans.set(guild.id, user.id, {
                    mod: this.cluster.discord.user,
                    type: 'Auto-Ban',
                    reason: `Exceeded Warning Limit (${warningCount}/${storedGuild.settings.banat})`
                })
                try {
                    await guild.banMember(user.id, 0, `[ Auto-Ban ] Exceeded warning limit (${warningCount}/${storedGuild.settings.banat})`);
                } catch (e) { error = e; }
                delete users[user.id];
            } else if (storedGuild.settings.kickat && storedGuild.settings.kickat > 0 && warningCount >= storedGuild.settings.kickat) {
                type = ModerationType.KICK;
                try {
                    await guild.kickMember(user.id, `[ Auto-Kick ] Exceeded warning limit (${warningCount}/${storedGuild.settings.kickat})`);
                } catch (e) { error = e; }
            }
        }
        await this.cluster.rethinkdb.query(r =>
            r.table('guild')
                .get(guild.id)
                .update({ warnings: r.literal(warnings) }));

        return { type, count: warningCount, error };
    };
}