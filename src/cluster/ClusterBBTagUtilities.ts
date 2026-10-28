import type { BBTagUtilities, MessageEvent, ReactionEvent, RwLock, SerializedBBTagContext, subtags, TagDetails, VariablesProvider } from '@blargbot/bbtag';
import { ChannelType, DiscordPermissions, getLock } from '@blargbot/bbtag';
import type * as Subtags from '@blargbot/bbtag/subtags';
import type { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core';
import { snowflake } from '@blargbot/core';
import Emote from '@blargbot/discord-emote';
import type { TagVariableScope } from '@blargbot/domain';
import type { IFormattable } from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import type { Logger } from '@blargbot/logger';
import { raceAsyncIterable, sleep, usingTimeout } from '@blargbot/util';
import Brainfuck from 'brainfuck-node';
import * as eris from 'eris';
import moment from 'moment-timezone';

import { isThreadChannel } from '../core/utils/guard/isThreadChannel.js';
import { bindAll } from './bindAll.js';
import type { Cluster } from './Cluster.js';
import { guard } from './utils/index.js';

type SubtagConstructorArgs = typeof subtags[keyof typeof subtags] extends new (arg: infer R) => unknown ? R : never;
@bindAll
export class ClusterSubtagConstructorArgs implements SubtagConstructorArgs {
    readonly #cluster: Cluster;
    readonly #bfClient: Brainfuck;

    public get defaultPrefix(): string {
        return this.#cluster.config.discord.defaultPrefix;
    };
    public get logger(): Logger {
        return this.#cluster.logger;
    }
    public get variables(): VariablesProvider {
        return this.#cluster.bbtagVariables;
    }

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
        this.#bfClient = new Brainfuck();
    }
    public async createEmoji(options: Subtags.CreateEmojiOptions): Promise<Subtags.CreateEmojiResult> {
        try {
            const guild = await this.#cluster.util.getGuild(options.guildId);
            const emoji = await guild?.createEmoji({
                image: `data:${options.contentType};base64,${Buffer.from(options.image.buffer, options.image.byteOffset, options.image.byteLength).toString('base64')}`,
                name: options.name,
                roles: [...options.roles]
            }, options.auditReason);
            if (emoji === undefined)
                return { success: false, cause: 'UNKNOWN', reason: 'Failed to create emoji' };
            return { success: true, emojiId: emoji.id };
        } catch (error) {
            const { reason } = this.#handleError(error);
            if (reason === undefined) return { success: false, cause: 'UNKNOWN' };
            const parts = reason.split('\n');
            return {
                success: false,
                cause: (parts[1] ?? parts[0]).trim(),
                reason
            };
        }
    }
    public async deleteEmoji(options: Subtags.DeleteEmojiOptions): Promise<Subtags.DeleteEmojiResult> {
        try {
            const guild = await this.#cluster.util.getGuild(options.guildId);
            const emoji = await guild?.deleteEmoji(options.emojiId, options.auditReason);
            if (emoji === undefined)
                return { success: false, cause: 'UNKNOWN', reason: 'Failed to delete emoji' };
            return { success: true };
        } catch (error) {
            const { reason } = this.#handleError(error);
            if (reason === undefined) return { success: false, cause: 'UNKNOWN' };
            const parts = reason.split('\n');
            return {
                success: false,
                cause: (parts[1] ?? parts[0]).trim(),
                reason
            };
        }
    }
    public async listEmojis(guildId: string, roleId?: string): Promise<readonly Emote[] | undefined> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined)
            return undefined;
        let emojis = guild.emojis;
        if (roleId !== undefined)
            emojis = emojis.filter(x => x.roles.includes(roleId));
        return emojis.map(x => new Emote(x.name, BigInt(x.id), x.animated));
    }
    public async getGuildCreatedTimestamp(guildId: string): Promise<Temporal.Instant | undefined> {
        const guild = await this.#cluster.util.getGuild(guildId);
        return this.#toTimestamp(guild, 'createdAt');
    }
    public async listGuildFeatures(guildId: string): Promise<readonly string[] | undefined> {
        const guild = await this.#cluster.util.getGuild(guildId);
        return guild?.features;
    }
    public async getGuildIcon(guildId: string): Promise<URL | null | undefined> {
        const guild = await this.#cluster.util.getGuild(guildId);
        const url = guild?.iconURL;
        if (typeof url !== 'string')
            return url;
        return new URL(url);
    }
    public async getGuildName(guildId: string): Promise<string | undefined> {
        const guild = await this.#cluster.util.getGuild(guildId);
        return guild?.name;
    }
    public async getGuildOwnerId(guildId: string): Promise<string | undefined> {
        const guild = await this.#cluster.util.getGuild(guildId);
        return guild?.ownerID;
    }
    public async setGuildIcon(options: Subtags.SetGuildIconOptions): Promise<Subtags.SetGuildIconResult> {
        try {
            const guild = await this.#cluster.util.getGuild(options.guildId);
            const emoji = await guild?.edit({
                icon: `data:${options.contentType};base64,${Buffer.from(options.image.buffer, options.image.byteOffset, options.image.byteLength).toString('base64')}`
            }, options.auditReason);
            if (emoji === undefined)
                return { success: false, cause: 'UNKNOWN', reason: 'Failed to create emoji' };
            return { success: true };
        } catch (error) {
            const { reason } = this.#handleError(error);
            if (reason === undefined) return { success: false, cause: 'UNKNOWN' };
            const parts = reason.split('\n');
            return {
                success: false,
                cause: (parts[1] ?? parts[0]).trim(),
                reason
            };
        }
    }
    public async getRoleColor(guildId: string, roleId: string): Promise<number | undefined> {
        const role = await this.#cluster.util.getRole(guildId, roleId);
        return role?.color;
    }
    public async createRole(options: Subtags.CreateRoleOptions): Promise<Subtags.CreateRoleResult> {
        try {
            const guild = await this.#cluster.util.getGuild(options.guildId);
            if (guild === undefined) return { success: false, reason: 'Guild not found' };
            const role = await guild.createRole({
                name: options.name,
                color: options.color,
                hoist: options.hoist,
                mentionable: options.mentionable,
                permissions: options.permissions.raw
            }, options.auditReason);
            return { success: true, roleId: role.id };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async deleteRole(options: Subtags.DeleteRoleOptions): Promise<Subtags.ApiResult> {
        try {
            const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
            if (role === undefined) return { success: false, reason: 'Role not found' };
            await role.delete(options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async checkRoleExists(guildId: string, roleId: string): Promise<boolean> {
        const role = await this.#cluster.util.getRole(guildId, roleId);
        return role !== undefined;
    }
    public async findRole(guildId: string, searchText: string): Promise<string | undefined> {
        const candidates = await this.#cluster.util.findRoles(guildId, searchText);
        return candidates.length === 1 ? candidates[0].id : undefined;
    }
    public async queryRole(request: Subtags.QueryEntityRequest): Promise<Subtags.QueryEntityResponse> {
        return await this.#queryEntity('Role', 'role', request);
    }
    public async getRoleName(guildId: string, roleId: string): Promise<string | undefined> {
        const role = await this.#cluster.util.getRole(guildId, roleId);
        return role?.name;
    }
    public async getRolePermissions(guildId: string, roleId: string): Promise<DiscordPermissions | undefined> {
        const role = await this.#cluster.util.getRole(guildId, roleId);
        if (role === undefined)
            return undefined;
        return new DiscordPermissions(role.permissions.allow);
    }
    public async getRolePosition(guildId: string, roleId: string): Promise<number | undefined> {
        const role = await this.#cluster.util.getRole(guildId, roleId);
        return role?.position;
    }
    public async setRoleColor(options: Subtags.SetRoleColorOptions): Promise<Subtags.ApiResult> {
        try {
            const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
            if (role === undefined) return { success: false, reason: 'Role not found' };
            await role.edit({ color: options.color }, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async setRoleMentionable(options: Subtags.SetRoleMentionableOptions): Promise<Subtags.ApiResult> {
        try {
            const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
            if (role === undefined) return { success: false, reason: 'Role not found' };
            await role.edit({ mentionable: options.mentionable }, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async setRoleName(options: Subtags.SetRoleNameOptions): Promise<Subtags.ApiResult> {
        try {
            const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
            if (role === undefined) return { success: false, reason: 'Role not found' };
            await role.edit({ name: options.name }, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async setRolePermissions(options: Subtags.SetRolePermissionsOptions): Promise<Subtags.ApiResult> {
        try {
            const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
            if (role === undefined) return { success: false, reason: 'Role not found' };
            await role.edit({ permissions: options.permissions.raw }, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async setRolePosition(options: Subtags.SetRolePositionOptions): Promise<Subtags.ApiResult> {
        try {
            const role = await this.#cluster.util.getRole(options.guildId, options.roleId);
            if (role === undefined) return { success: false, reason: 'Role not found' };
            await role.editPosition(options.position);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async getMemberTimeout(guildId: string, userId: string): Promise<Temporal.Instant | null | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        if (member === undefined)
            return undefined;
        const timeout = member.communicationDisabledUntil;
        return timeout !== null ? Temporal.Instant.fromEpochMilliseconds(timeout) : null;
    }
    public async addMemberRoles(options: Subtags.AddMemberRolesOptions): Promise<Subtags.ApiResult> {
        try {
            const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
            if (member === undefined) return { success: false, reason: 'Member not found.' };
            const roles = new Set([...options.roleIds, ...member.roles]);
            if (roles.size === member.roles.length)
                return { success: false, reason: 'No roles added' };
            await member.edit({ roles: [...roles] }, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async listMemberRoles(guildId: string, userId: string): Promise<readonly string[] | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        return member?.roles;
    }
    public async listGuildRoles(guildId: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        return guild?.roles.map(r => r.id) ?? [];
    }
    public async removeMemberRoles(options: Subtags.RemoveMemberRolesOptions): Promise<Subtags.ApiResult> {
        try {
            const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
            if (member === undefined) return { success: false, reason: 'Member not found.' };
            const roles = new Set(member.roles).difference(new Set(options.roleIds));
            if (roles.size === member.roles.length)
                return { success: false, reason: 'No roles removed' };
            await member.edit({ roles: [...roles] }, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async getMemberBoostTimestamp(guildId: string, userId: string): Promise<Temporal.Instant | null | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        return this.#toTimestamp(member, 'premiumSince');
    }
    public async getMemberActivityName(guildId: string, userId: string): Promise<string | null | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        if (member === undefined)
            return undefined;
        return member.activities?.[0]?.name ?? null;
    }
    public async getMemberActivityType(guildId: string, userId: string): Promise<number | null | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        if (member === undefined)
            return undefined;
        return member.activities?.[0]?.type ?? null;
    }
    public async getUserAvatarUrl(userId: string): Promise<URL | undefined> {
        const user = await this.#cluster.util.getUser(userId);
        if (user === undefined)
            return undefined;
        return new URL(user.avatarURL);
    }
    public async getUserCreatedTimestamp(userId: string): Promise<Temporal.Instant | undefined> {
        const user = await this.#cluster.util.getUser(userId);
        return this.#toTimestamp(user, 'createdAt');
    }
    public async checkUserIsBot(userId: string): Promise<boolean | undefined> {
        const user = await this.#cluster.util.getUser(userId);
        return user?.bot;
    }
    public async getMemberJoinTimestamp(guildId: string, userId: string): Promise<Temporal.Instant | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        return this.#toTimestamp(member, 'joinedAt') ?? undefined;
    }
    public async getUserName(userId: string): Promise<string | undefined> {
        const user = await this.#cluster.util.getUser(userId);
        return user?.username;
    }
    public async getMemberNickname(guildId: string, userId: string): Promise<string | null | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        return member?.nick;
    }
    public async getUserNickname(userId: string): Promise<string | null | undefined> {
        const user = await this.#cluster.util.getUser(userId);
        return user === undefined ? undefined : null;
    }
    public async setMemberNickname(options: Subtags.SetMemberNicknameOptions): Promise<Subtags.ApiResult> {
        try {
            const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
            if (member === undefined) return { success: false, reason: 'Member not found.' };
            await member.edit({ nick: options.nickname }, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async setMemberRoles(options: Subtags.SetMemberRolesOptions): Promise<Subtags.ApiResult> {
        try {
            const member = await this.#cluster.util.getMember(options.guildId, options.targetId);
            if (member === undefined) return { success: false, reason: 'Member not found.' };
            const roles = new Set(options.roleIds);
            if (roles.symmetricDifference(new Set(member.roles)).size === 0)
                return { success: false, reason: 'No roles changed' };
            await member.edit({ roles: [...roles] });
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async getMemberStatus(guildId: string, userId: string): Promise<string | undefined> {
        const member = await this.#cluster.util.getMember(guildId, userId);
        if (member === undefined)
            return undefined;
        return member.status ?? 'offline';
    }

    public executeBrainfuck(code: string, input: string): Promise<string> {
        return Promise.resolve(this.#bfClient.execute(code, input).output);
    }
    public async fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
        return await this.#cluster.fetch(input, init);
    }
    public getLock(scope: TagVariableScope, name: string): RwLock {
        return getLock(scope, name);
    }
    public async sleep(delay: number, signal?: AbortSignal): Promise<void> {
        return await sleep(delay, signal);
    }
    public canRequestDomain(domain: string): Promise<boolean> {
        return Promise.resolve(this.#cluster.domains.isWhitelisted(domain));
    }
    public async getTag(name: string): Promise<TagDetails | undefined> {
        const tag = await this.#cluster.database.tags.get(name);
        if (tag === undefined)
            return undefined;
        return {
            content: tag.content,
            cooldown: tag.cooldown
        };
    }
    public async getCustomCommand(guildId: string, name: string): Promise<TagDetails | 'alias' | undefined> {
        const ccommand = await this.#cluster.database.guilds.getCommand(guildId, name);
        if (ccommand === undefined)
            return undefined;
        if ('alias' in ccommand)
            return 'alias';
        return {
            content: ccommand.content,
            cooldown: ccommand.cooldown
        };
    }
    public async checkUserExists(userId: string): Promise<boolean> {
        return await this.#cluster.util.getUser(userId) !== undefined;
    }
    public async checkMemberExists(guildId: string, userId: string): Promise<boolean> {
        return await this.#cluster.util.getMember(guildId, userId) !== undefined;
    }
    public async findMember(guildId: string, searchText: string): Promise<string | undefined> {
        const candidates = await this.#cluster.util.findMembers(guildId, searchText);
        return candidates.length === 1 ? candidates[0].id : undefined;
    }
    public async queryMember(options: Subtags.QueryEntityRequest): Promise<Subtags.QueryEntityResponse> {
        return await this.#queryEntity('Member', 'user', options);
    }
    public async getDmChannelId(userId: string): Promise<string | undefined> {
        const user = await this.#cluster.util.getUser(userId);
        return (await user?.getDMChannel())?.id;
    }
    public async isUserStaff(guildId: string, userId: string): Promise<boolean> {
        const guild = await this.#cluster.util.getGuild(guildId);
        const member = guild?.members.get(userId);
        if (member === undefined)
            return false;
        return await this.#cluster.util.isUserStaff(member);
    }
    public async getMemberPermissions(guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions> {
        const result = await this.#getUserPermissions(guildId, userId, channelId);
        return result.has('ADMINISTRATOR')
            ? DiscordPermissions.NONE.not()
            : result;
    }
    async #getUserPermissions(guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (channelId === undefined)
            return new DiscordPermissions(guild?.members.get(userId)?.permissions.allow ?? 0n);

        const channel = guild?.channels.get(channelId);
        return new DiscordPermissions(channel?.permissionsOf(userId).allow ?? 0n);
    }
    public async getWarnings(guildId: string, userId: string): Promise<number | undefined> {
        return await this.#cluster.database.guilds.getWarnings(guildId, userId);
    }
    public async warnUser(options: Subtags.WarnOptions): Promise<number> {
        const { guildId, targetId, moderatorId, count, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return 0;
        const target = guild.members.get(targetId);
        if (target === undefined) return 0;
        const moderator = this.#cluster.discord.users.get(moderatorId);
        if (moderator === undefined) return 0;
        const result = await this.#cluster.moderation.warns.warn(target, moderator, this.#cluster.discord.user, count, util.literal(reason));
        return result.warnings;
    }
    public async pardonUser(options: Subtags.PardonOptions): Promise<number> {
        const { guildId, targetId, moderatorId, count, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return 0;
        const target = guild.members.get(targetId);
        if (target === undefined) return 0;
        const moderator = this.#cluster.discord.users.get(moderatorId);
        if (moderator === undefined) return 0;
        const result = await this.#cluster.moderation.warns.pardon(target, moderator, count, util.literal(reason));
        return result.warnings;
    }
    public async getBannedUsers(guildId: string): Promise<readonly string[] | undefined> {
        try {
            const guild = await this.#cluster.util.getGuild(guildId);
            if (guild === undefined) return undefined;
            await this.#cluster.util.ensureGuildBans(guild);
            return [...this.#cluster.util.getGuildBans(guild)];
        } catch (error) {
            this.#handleError(error);
            return undefined;
        }
    }
    public async banUser(options: Subtags.BanUserOptions): Promise<Subtags.BanUserResult> {
        const { guildId, targetId, moderatorId, authorizerId, daysToDelete, auditReason: reason, unbanAfter } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, cause: 'bot' };
        const target = await this.#cluster.util.getUser(targetId);
        if (target === undefined) return { success: false, cause: 'bot' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, cause: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, cause: 'authorizer' };
        const result = await this.#cluster.moderation.bans.ban(
            guild,
            target,
            moderator,
            authorizer,
            daysToDelete,
            util.literal(reason),
            this.#toMomentDuration(unbanAfter) ?? moment.duration(Infinity)
        );
        switch (result) {
            case 'success':
            case 'alreadyBanned':
                return { success: true };
            case 'memberTooHigh':
            case 'noPerms':
                return { success: false, cause: 'bot' };
            case 'moderatorNoPerms':
            case 'moderatorTooLow':
                return { success: false, cause: 'authorizer' };
            default:
                return { success: false, cause: result };
        }
    }
    public async unbanUser(options: Subtags.UnbanUserOptions): Promise<Subtags.UnbanUserResult> {
        const { guildId, targetId, moderatorId, authorizerId, auditReason: reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, cause: 'bot' };
        const target = await this.#cluster.util.getUser(targetId);
        if (target === undefined) return { success: false, cause: 'notBanned' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, cause: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, cause: 'authorizer' };
        const result = await this.#cluster.moderation.bans.unban(guild, target, moderator, authorizer, util.literal(reason));
        switch (result) {
            case 'success':
                return { success: true };
            case 'notBanned':
                return { success: false, cause: 'notBanned' };
            case 'noPerms':
                return { success: false, cause: 'bot' };
            case 'moderatorNoPerms':
                return { success: false, cause: 'authorizer' };
            default:
                return { success: false, cause: result };
        }
    }
    public async kickMember(options: Subtags.KickUserOptions): Promise<Subtags.KickUserResult> {
        const { guildId, targetId, moderatorId, authorizerId, auditReason: reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, cause: 'bot' };
        const target = guild.members.get(targetId);
        if (target === undefined) return { success: false, cause: 'bot' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, cause: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, cause: 'authorizer' };
        const result = await this.#cluster.moderation.bans.kick(target, moderator, authorizer, util.literal(reason));
        switch (result) {
            case 'success':
                return { success: true };
            case 'noPerms':
            case 'memberTooHigh':
                return { success: false, cause: 'bot' };
            case 'moderatorNoPerms':
            case 'moderatorTooLow':
                return { success: false, cause: 'authorizer' };
            default:
                return { success: false, cause: result };
        }
    }
    public async setMemberTimeout(options: Subtags.SetUserTimeoutOptions): Promise<Subtags.SetUserTimeoutResult> {
        const { guildId, targetId, moderatorId, authorizerId, reason, duration } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, cause: 'bot' };
        const target = guild.members.get(targetId);
        if (target === undefined) return { success: false, cause: 'bot' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, cause: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, cause: 'authorizer' };
        const result = duration.sign === 0
            ? await this.#cluster.moderation.timeouts.clearTimeout(target, moderator, authorizer, util.literal(reason))
            : await this.#cluster.moderation.timeouts.timeout(target, moderator, authorizer, this.#toMomentDuration(duration), util.literal(reason));
        switch (result) {
            case 'success':
                return { success: true };
            case 'alreadyTimedOut':
            case 'notTimedOut':
                return { success: false, cause: 'noChange' };
            case 'noPerms':
            case 'memberTooHigh':
                return { success: false, cause: 'bot' };
            case 'moderatorNoPerms':
            case 'moderatorTooLow':
                return { success: false, cause: 'authorizer' };
            default:
                return { success: false, cause: result };
        }
    }
    public async addModLog(options: Subtags.AddModLogOptions): Promise<void> {
        const { guildId, targetId, moderatorId, action, color, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return;
        const target = this.#cluster.discord.users.get(targetId);
        if (target === undefined) return;
        const moderator = this.#cluster.discord.users.get(moderatorId);
        if (moderator === undefined) return;
        await this.#cluster.moderation.modLog.logCustom(guild, util.literal(action), target, moderator, util.literal(reason), color);
    }
    public async getUserTimezone(userId: string): Promise<string | undefined> {
        return await this.#cluster.database.users.getProp(userId, 'timezone');
    }
    public async getPrefix(guildId: string): Promise<readonly string[] | undefined> {
        return await this.#cluster.database.guilds.getSetting(guildId, 'prefix');
    }
    public async canPingEveryone(guildId: string): Promise<boolean> {
        return await this.#cluster.database.guilds.getSetting(guildId, 'disableeveryone') !== true;
    }
    public async listRoleMembers(guildId: string, roleId: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return [];
        await this.#cluster.util.ensureMemberCache(guild);
        return guild.members.filter(m => m.roles.includes(roleId))
            .map(m => m.id);
    }
    public async getRoleMemberCount(guildId: string, roleId: string): Promise<number> {
        const members = await this.listRoleMembers(guildId, roleId);
        return members.length;
    }
    public async listGuildMembers(guildId: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return [];
        await this.#cluster.util.ensureMemberCache(guild);
        return guild.members.map(m => m.id);
    }
    public async getGuildMemberCount(guildId: string): Promise<number> {
        const members = await this.listGuildMembers(guildId);
        return members.length;
    }
    public async generateDumpLink(options: Subtags.DumpOptions): Promise<URL> {
        const id = await this.#cluster.util.generateDumpPage({ content: options.content }, snowflake.parse(options.channelId));
        return new URL(this.#cluster.util.websiteLink(`dumps/${id}`));
    }
    public async executeWebhook(webhookId: string, webhookToken: string, payload: Subtags.ExecuteWebhookPayload): Promise<Subtags.ApiResult> {
        try {
            await this.#cluster.discord.executeWebhook(webhookId, webhookToken, payload);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async sendMessage(channelId: string, payload: Subtags.SendPayload): Promise<Subtags.SendResult> {
        try {
            const channel = this.#cluster.discord.getChannel(channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel not found.' };
            if (!guard.isTextableChannel(channel))
                return { success: false, reason: 'Channel cannot receive messages.' };
            const message = await this.#cluster.util.send(channel, util.literal({
                content: payload.content,
                embeds: payload.embeds,
                file: payload.files,
                allowedMentions: payload.allowedMentions !== undefined ? {
                    everyone: payload.allowedMentions.everyone,
                    roles: [...payload.allowedMentions.roles],
                    users: [...payload.allowedMentions.users]
                } : undefined
            }));
            if (message === undefined)
                return { success: false };
            return { success: true, id: message.id };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async addMessageReactions(channelId: string, messageId: string, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }> {
        const channel = this.#cluster.discord.getChannel(channelId);
        if (channel === undefined || !guard.isTextableChannel(channel))
            return { success: [], failed: [...reactions] };
        let message;
        try {
            message = channel.messages.get(messageId) ?? await channel.getMessage(messageId);
        } catch {
            return { success: [], failed: [...reactions] };
        }

        return await this.#cluster.util.addReactions(message, reactions);
    }
    public async scheduleBBTag(context: SerializedBBTagContext, code: string, timestamp: Temporal.Instant): Promise<void> {
        const channel = context.msg.channel.id;
        const guild = this.#cluster.discord.channelGuildMap[channel];
        await this.#cluster.timeouts.insert('tag', {
            version: 4,
            source: guild,
            channel: channel,
            endtime: timestamp.epochMilliseconds,
            context: JSON.stringify(context),
            content: code
        });
    }
    public async* streamReactions(messageIds: Iterable<string>, timeoutMs: number): AsyncIterable<ReactionEvent> {
        const abort = new AbortController();
        using _onTimeout = usingTimeout(() => abort.abort(), timeoutMs);
        const partitions = Iterator.from(messageIds).map(x => this.#cluster.awaiter.reactions.getPartition(x));
        yield* raceAsyncIterable(partitions, abort.signal);
    }
    public async* streamMessages(channelIds: Iterable<string>, timeoutMs: number): AsyncIterable<MessageEvent> {
        const abort = new AbortController();
        using _onTimeout = usingTimeout(() => abort.abort(), timeoutMs);
        const messages = this.#cluster.awaiter.messages;
        const partitions = Iterator.from(channelIds).map(async function* (x) {
            for await (const message of messages.getPartition(x)) {
                yield {
                    messageId: message.id,
                    channelId: message.channel.id,
                    guildId: 'guild' in message.channel
                        ? message.channel.guild.id
                        : undefined,
                    authorId: message.author.id
                };
            }
        });
        yield* raceAsyncIterable(partitions, abort.signal);
    }
    async #getChannel(guildId: string, channelId: string): Promise<eris.KnownGuildChannel | undefined> {
        if (!snowflake.test(guildId) || !snowflake.test(channelId))
            return undefined;
        const channel = await this.#cluster.util.getChannel(channelId);
        if (channel === undefined || !('guild' in channel) || channel.guild.id !== guildId)
            return undefined;
        return channel;
    }
    async #getChannelProp<Prop extends KeysOfUnion<eris.KnownChannel>>(guildId: string, channelId: string, prop: Prop): Promise<ValueOfUnion<eris.KnownChannel, Prop> | undefined> {
        const channel = await this.#getChannel(guildId, channelId);
        if (channel === undefined || !(prop in channel))
            return undefined;
        return channel[prop as never];
    }
    public async getCategoryChannels(guildId: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        return guild?.channels.filter(c => c.type === ChannelType.GUILD_CATEGORY).map(x => x.id) ?? [];
    }
    public async getChannelName(guildId: string, channelId: string): Promise<string | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'name');
    }
    public async getChannelCategory(guildId: string, channelId: string): Promise<string | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'parentID') ?? undefined;
    }
    public async getChannelType(guildId: string, channelId: string): Promise<number | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'type');
    }
    public async getLastMessageId(guildId: string, channelId: string): Promise<string | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'lastMessageID');
    }
    public async deleteChannel(options: Subtags.DeleteChannelOptions): Promise<Subtags.ApiResult> {
        try {
            const channel = await this.#getChannel(options.guildId, options.channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel doesnt exist.' };
            await channel.delete(options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async createChannel(guildId: string, { name, type, ...options }: Subtags.CreateChannelOptions): Promise<Subtags.CreateChannelResult> {
        try {
            const guild = await this.#cluster.util.getGuild(guildId);
            if (guild === undefined)
                return { success: false, reason: 'Guild is missing' };
            const channel = await guild.createChannel(name, type, options) as eris.GuildChannel;
            return { success: true, channelId: channel.id };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async editChannel(options: Subtags.EditChannelOptions): Promise<Subtags.ApiResult> {
        try {
            const channel = await this.#getChannel(options.guildId, options.channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel not found' };
            await channel.edit(options);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async setPermissionOverride(options: Subtags.SetPermissionOverrideOptions): Promise<Subtags.ApiResult> {
        try {
            const channel = await this.#getChannel(options.guildId, options.channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel not found' };
            if ('allow' in options)
                await channel.editPermission(options.entityId, options.allow, options.deny, options.type, options.auditReason);
            else
                await channel.deletePermission(options.entityId, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async isChannelNsfw(guildId: string, channelId: string): Promise<boolean | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'nsfw');
    }
    public async listChannels(guildId: string, parentId?: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined)
            return [];
        const channels = parentId === undefined
            ? guild.channels
            : guild.channels.filter(c => c.parentID === parentId);
        return channels.map(c => c.id);
    }
    public async getChannelPosition(guildId: string, channelId: string): Promise<number | 'thread' | undefined> {
        const channel = await this.#getChannel(guildId, channelId);
        if (channel === undefined) return undefined;
        if (isThreadChannel(channel)) return 'thread';
        return channel.position;
    }
    public async checkChannelExists(guildId: string, channelId: string): Promise<boolean> {
        return await this.#getChannelProp(guildId, channelId, 'id') === channelId;
    }
    public async findChannel(guildId: string, searchText: string): Promise<string | undefined> {
        const candidates = await this.#cluster.util.findChannels(guildId, searchText);
        return candidates.length === 1 ? candidates[0].id : undefined;
    }
    public async queryChannel(options: Subtags.QueryEntityRequest): Promise<Subtags.QueryEntityResponse> {
        return await this.#queryEntity('Channel', 'channel', options);
    }
    public async checkMessageExists(channelId: string, messageId: string): Promise<boolean> {
        return await this.#cluster.util.getMessage(channelId, messageId) !== undefined;
    }
    public async deleteMessage(channelId: string, messageId: string): Promise<Subtags.DeleteMessageResult> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        if (message === undefined)
            return { success: false, cause: 'notFound' };
        try {
            await message.delete();
            return { success: true };
        } catch (error) {
            const { reason } = this.#handleError(error);
            return { success: false, cause: 'failed', reason };
        }
    }
    public async editMessage(options: Subtags.EditMessageOptions): Promise<Subtags.EditMessageResult> {
        const { channelId, messageId, ...data } = options;
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        if (message === undefined)
            return { success: false, cause: 'failed', reason: 'Message doesnt exist.' };
        const { content = message.content, embeds = message.embeds } = options;
        if (content === '' && embeds.length === 0 && message.attachments.length === 0 && (message.components?.length ?? 0) === 0)
            return { success: false, cause: 'messageEmpty', reason: 'Message is empty.' };

        try {
            await message.edit(data);
            return { success: true };
        } catch (error) {
            const { reason } = this.#handleError(error);
            return { success: false, cause: 'failed', reason };
        }
    }
    public async getMessageAttachmentUrls(channelId: string, messageId: string): Promise<readonly URL[] | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        return message?.attachments.map(a => new URL(a.url));
    }
    public async getMessageAuthor(channelId: string, messageId: string): Promise<string | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        return message?.author.id;
    }
    public async getMessageEmbeds(channelId: string, messageId: string): Promise<readonly eris.Embed[] | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        return message?.embeds;
    }
    public async getMessageContent(channelId: string, messageId: string): Promise<string | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        return message?.content;
    }
    public async getMessageReplyTarget(channelId: string, messageId: string): Promise<string | null | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        if (message === undefined)
            return undefined;
        return message.referencedMessage?.id ?? null;
    }
    public async getMessageTimestamp(channelId: string, messageId: string): Promise<Temporal.Instant | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        return this.#toTimestamp(message, 'timestamp');
    }
    public async getMessageEditTimestamp(channelId: string, messageId: string): Promise<Temporal.Instant | null | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        return this.#toTimestamp(message, 'editedTimestamp');
    }
    public async getMessageType(channelId: string, messageId: string): Promise<number | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        return message?.type;
    }
    public async listMessageReactions(channelId: string, messageId: string): Promise<readonly Emote[] | undefined> {
        const message = await this.#cluster.util.getMessage(channelId, messageId, true);
        if (message === undefined)
            return undefined;
        return Object.keys(message.reactions).map(v => Emote.parse(v));
    }
    public async listMessageReactionUsers(channelId: string, messageId: string, emote: Emote): Promise<readonly string[] | undefined> {
        try {
            const message = await this.#cluster.util.getMessage(channelId, messageId);
            const users = await message?.getReaction(emote.toApi());
            return users?.map(x => x.id);
        } catch (error) {
            this.#handleError(error);
            return [];
        }
    }
    public async removeMessageReactionUser(channelId: string, messageId: string, emote: Emote, userId: string): Promise<Subtags.ApiResult> {
        try {
            const message = await this.#cluster.util.getMessage(channelId, messageId);
            await message?.removeReaction(emote.toApi(), userId);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async removeMessageReactions(channelId: string, messageId: string): Promise<void> {
        const message = await this.#cluster.util.getMessage(channelId, messageId);
        await message?.removeReactions();
    }

    async #queryEntity<Kind extends 'Channel' | 'Role' | 'Member'>(kind: Kind, kindName: string, options: Subtags.QueryEntityRequest): Promise<Subtags.QueryEntityResponse> {
        type Entity = {
            ['Channel']: eris.KnownGuildChannel;
            ['Role']: eris.Role;
            ['Member']: eris.Member;
        }[Kind];
        type ChooseFn = (options: EntityPickQueryOptions<IFormattable<string>, Entity>) => Promise<ChoiceQueryResult<Entity>>;
        const candidates = await this.#cluster.util[`find${kind}s`](options.guildId, options.searchText) as Entity[];
        if (candidates.length === 1)
            return { success: true, id: candidates[0].id };
        const channel = await this.#cluster.util.getChannel(options.channelId);
        if (channel === undefined || !guard.isTextableChannel(channel))
            return { success: false, cause: 'aborted' };
        if (candidates.length === 0) {
            if (options.source !== undefined) {
                await this.#cluster.util.send(channel, util.literal({
                    content: `No ${kindName} matching \`${options.searchText}\` found in ${options.source}.`
                }));
            }
            return { success: false, cause: 'notFound' };
        }

        const result = await (this.#cluster.util[`query${kind}`] as ChooseFn)({
            context: channel,
            actors: [options.userId],
            choices: candidates,
            filter: options.searchText
        });
        switch (result.state) {
            case 'SUCCESS':
                return { success: true, id: result.value.id };
            case 'CANCELLED':
            case 'TIMED_OUT':
                return { success: false, cause: 'aborted' };
            case 'FAILED':
            case 'NO_OPTIONS':
                return { success: false, cause: 'notFound' };
            default:
                return { success: false, cause: result };
        }
    }
    #handleError(error: unknown): { success: false; reason?: string; } {
        if (error instanceof eris.DiscordHTTPError || error instanceof eris.DiscordRESTError)
            return { success: false, reason: error.message };

        if (!(error instanceof Error)) {
            const e = error = new Error(String(error));
            Error.captureStackTrace(e, this.#handleError);
        }
        this.#cluster.logger.error(error);
        return { success: false };
    }
    #toTimestamp<Prop extends PropertyKey>(target: { readonly [P in Prop]?: number } | undefined, prop: Prop): Temporal.Instant | undefined
    #toTimestamp<Prop extends PropertyKey>(target: { readonly [P in Prop]?: number | null } | undefined, prop: Prop): Temporal.Instant | undefined | null
    #toTimestamp<Prop extends PropertyKey>(target: { readonly [P in Prop]?: number | null } | undefined, prop: Prop): Temporal.Instant | undefined | null {
        const value = target?.[prop];
        switch (value) {
            case undefined: return undefined;
            case null: return null;
            default: return Temporal.Instant.fromEpochMilliseconds(value);
        }
    }
    #toMomentDuration(duration: Temporal.Duration): moment.Duration
    #toMomentDuration(duration: Temporal.Duration | undefined): moment.Duration | undefined
    #toMomentDuration(duration: Temporal.Duration | undefined): moment.Duration | undefined {
        if (duration === undefined)
            return undefined;
        return moment.duration({
            years: duration.years,
            months: duration.months,
            weeks: duration.weeks,
            days: duration.days,
            hours: duration.hours,
            minutes: duration.minutes,
            seconds: duration.seconds,
            // moment has no microsecond or nanosecond fields, but it stores milliseconds as a float
            milliseconds: duration.milliseconds + (duration.microseconds * 1e3 + duration.nanoseconds) / 1e6
        });
    }
}
export class ClusterBBTagUtilities implements BBTagUtilities {
    public constructor(public readonly cluster: Cluster) {
    }
    public async getChannelGuild(channelId: string): Promise<string | undefined> {
        const channel = await this.cluster.util.getChannel(channelId);
        return channel !== undefined && 'guild' in channel ? channel.guild.id : undefined;
    }
    public async getMessageAuthor(channelId: string, messageId: string): Promise<string | undefined> {
        const message = await this.cluster.util.getMessage(channelId, messageId);
        return message?.author.id;
    }
}

type KeysOfUnion<T> = T extends unknown ? keyof T : never;
type ValueOfUnion<T, K extends PropertyKey> =
    T extends unknown ? K extends keyof T ? T[K] : never : never;
