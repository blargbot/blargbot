import { GuildMessage, Client as ErisClient, Member, EmbedAuthorOptions, EmbedField, EmbedOptions, Permission, User } from 'eris';
import { ClusterUtilities } from '../ClusterUtilities';
import { humanize, oldBu as globalOldBu } from './globalCore';
import { defaultStaff } from './utils';
import config from '../../../../config.json';

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
        if (member === null)
            return false;

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
    async logEvent(
        guildid: string,
        userids: string | string[],
        event: string,
        fields: EmbedField[],
        embed: EmbedOptions
    ): Promise<void> {
        const storedGuild = await util.database.guilds.get(guildid);
        if (storedGuild === undefined) throw new Error('Cannot find guild');
        const log = storedGuild.log ?? {};
        const logIgnore = storedGuild.logIgnore ?? [];
        if (!Array.isArray(userids)) userids = [userids];
        // If there are not any userId's that are not contained in the ignore, then return
        // I.e. if all the users are contained in the ignore list
        if (!userids.some(id => !logIgnore.includes(id)))
            return;
        event = event.toLowerCase();

        let roleAdd = false;
        if (event.startsWith('role:')) {
            const c = event.split(':');
            // const roleId = c[1];
            roleAdd = c[2] === 'add';
            event = c.slice(0, 2).join(':');
        }

        if (event in log) {
            let color;
            let eventName;
            switch (event) {
                case 'messagedelete':
                    color = 0xaf1d1d;
                    eventName = 'Message Deleted';
                    break;
                case 'messageupdate':
                    color = 0x771daf;
                    eventName = 'Message Updated';
                    break;
                case 'nameupdate':
                    color = 0xd8af1a;
                    eventName = 'Username Updated';
                    break;
                case 'avatarupdate':
                    color = 0xd8af1a;
                    eventName = 'Avatar Updated';
                    break;
                case 'nickupdate':
                    color = 0xd8af1a;
                    eventName = 'Nickname Updated';
                    break;
                case 'memberjoin':
                    color = 0x1ad8bc;
                    eventName = 'User Joined';
                    break;
                case 'memberleave':
                    color = 0xd8761a;
                    eventName = 'User Left';
                    break;
                case 'memberunban':
                    color = 0x17c914;
                    eventName = 'User Was Unbanned';
                    break;
                case 'memberban':
                    color = 0xcc0c1c;
                    eventName = 'User Was Banned';
                    break;
                case 'kick':
                    color = 0xe8b022;
                    eventName = 'User Was Kicked';
                    break;
                default:
                    if (event.startsWith('role:')) {
                        eventName = `Special Role ${roleAdd ? 'Added' : 'Removed'}`;
                    }
                    break;
            }
            const channel = log[event];
            embed ??= {};
            embed.title = `ℹ ${eventName ?? ''}`;
            embed.timestamp = new Date();
            embed.fields = fields;
            embed.color = color;
            try {
                await util.send(channel, { embed });
            } catch (err: unknown) {
                await util.database.guilds.setLogChannel(guildid, event, undefined);
                await util.send(guildid, `Disabled event \`${event}\` because either output channel doesn't exist, or I don't have permission to post messages in it.`);
            }
        }
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
