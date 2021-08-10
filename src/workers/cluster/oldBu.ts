import { defaultStaff, humanize } from '@cluster/utils';
import config from '@config';
import { guard, oldBu as globalOldBu } from '@core/utils';
import { Client as Discord, GuildMember, GuildMessage, MessageEmbedAuthor, Permissions, PermissionString, User } from 'discord.js';

import { ClusterUtilities } from './ClusterUtilities';

const util = <ClusterUtilities><unknown>undefined;
const bot = <Discord><unknown>undefined;

export const oldBu = {
    ...globalOldBu,

    async isBlacklistedChannel(channelid: string): Promise<boolean> {
        const channel = bot.channels.cache.get(channelid);
        const guildid = channel !== undefined && guard.isGuildChannel(channel) ? channel.guild.id : undefined;
        if (guildid === undefined) {
            //console.warn('Couldn\'t find a guild that corresponds with channel ' + channelid + ' - isBlacklistedChannel');
            return false;
        }

        const guild = await util.database.guilds.get(guildid);

        return guild?.channels[channelid]?.blacklisted ?? false;
    },
    async hasPerm(
        msg: GuildMessage | GuildMember,
        perm: string | string[],
        quiet = false,
        override = true
    ): Promise<boolean> {
        const member = msg instanceof GuildMember ? msg : msg.member;
        if (override && (member.id === config.discord.users.owner ||
            member.guild.ownerId === member.id ||
            member.permissions.has('ADMINISTRATOR'))) {
            return true;
        }

        const roles = member.guild.roles.cache.filter(m => {
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

        for (const [, role] of roles) {
            if (member.roles.cache.has(role.id)) {
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
    comparePerms(m: GuildMember, allow: number | readonly PermissionString[]): boolean {
        if (allow === 0) allow = defaultStaff;
        const newPerm = new Permissions(typeof allow === 'number' ? BigInt(Math.floor(allow)) : allow);
        for (const key of newPerm.toArray()) {
            if (m.permissions.has(key)) {
                return true;
            }
        }
        return false;
    },
    getAuthor(user: User): MessageEmbedAuthor {
        return {
            name: humanize.fullName(user),
            url: util.websiteLink(`/user/${user.id}`),
            iconURL: user.avatarURL() ?? user.defaultAvatarURL
        };
    }
};

function getId(text: string): string | undefined {
    const match = /[0-9]{17,23}/.exec(text);
    return match?.[1] ?? undefined;
}
