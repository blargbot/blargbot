import { defaultStaff, humanize } from '@cluster/utils';
import config from '@config';
import { oldBu as globalOldBu } from '@core/utils';
import { Client as ErisClient, EmbedAuthorOptions, GuildMessage, Member, Permission, User } from 'eris';

import { ClusterUtilities } from './ClusterUtilities';

const util = <ClusterUtilities><unknown>undefined;
const bot = <ErisClient><unknown>undefined;

export const oldBu = {
    ...globalOldBu,

    async isBlacklistedChannel(channelid: string): Promise<boolean> {
        const guildid = bot.channelGuildMap[channelid] as string | undefined;
        if (guildid === undefined) {
            //console.warn('Couldn\'t find a guild that corresponds with channel ' + channelid + ' - isBlacklistedChannel');
            return false;
        }

        const guild = await util.database.guilds.get(guildid);

        return guild?.channels[channelid]?.blacklisted ?? false;
    },
    async hasPerm(
        msg: GuildMessage | Member,
        perm: string | string[],
        quiet = false,
        override = true
    ): Promise<boolean> {
        const member = msg instanceof Member ? msg : msg.member;
        if (override && (member.id === config.discord.users.owner ||
            member.guild.ownerID === member.id ||
            member.permissions.json.administrator)) {
            return true;
        }

        const roles = member.guild.roles.filter(m => {
            if (Array.isArray(perm) ?
                perm.map(q => q.toLowerCase()).includes(m.name.toLowerCase()) :
                m.name.toLowerCase() === perm.toLowerCase()) {
                return true;
            }
            const roles = [];

            if (Array.isArray(perm)) {
                for (const p of perm) {
                    const id = getId(p);
                    if (id !== undefined)
                        roles.push(id);
                }
            } else {
                roles.push(getId(perm));
            }
            return roles.includes(m.id);

        });
        for (const role of roles) {
            if (member.roles.includes(role.id)) {
                return true;
            }
        }
        if (!quiet && 'content' in msg) {
            const guild = await util.database.guilds.get(member.guild.id);
            if (guild?.settings.disablenoperms !== true) {
                const permString = Array.isArray(perm) ? perm.map(m => '`' + m + '`').join(', or ') : '`' + perm + '`';
                void util.send(msg, `You need the role ${permString} in order to use this command!`);
            }
        }
        return false;
    },
    async canDmErrors(userId: string): Promise<boolean> {
        const storedUser = await util.database.users.get(userId, true);
        return storedUser?.dontdmerrors !== true;
    },
    comparePerms(m: Member, allow: number): boolean {
        if (allow === 0) allow = defaultStaff;
        const newPerm = new Permission(allow, 0);
        for (const key in newPerm.json) {
            if (m.permissions.has(key)) {
                return true;
            }
        }
        return false;
    },
    getAuthor(user: User): EmbedAuthorOptions {
        return {
            name: humanize.fullName(user),
            url: util.websiteLink(`/user/${user.id}`),
            icon_url: user.avatarURL
        };
    }
};

function getId(text: string): string | undefined {
    const match = /[0-9]{17,23}/.exec(text);
    return match?.[1] ?? undefined;
}
