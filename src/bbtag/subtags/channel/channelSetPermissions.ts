import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { DiscordPermissions } from '../../enums.js';
import { PermissionOverwriteType } from '../../enums.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult, GetUserPermissionsThunk } from '../types.js';
import { ChannelIdSubtag } from './channelId.js';
import { ChannelIsThreadSubtag } from './channelIsThread.js';

const tag = templates.subtags.channelSetPermissions;

interface SetPermissionOverrideOptionsBase {
    guildId: string;
    channelId: string;
    entityId: string;
    type: PermissionOverwriteType;
    auditReason: string;
}
export type SetPermissionOverrideOptions =
    | SetPermissionOverrideOptionsBase & { allow: bigint; deny: bigint; }
    | SetPermissionOverrideOptionsBase

export interface SetPermissionOverrideThunk {
    (options: SetPermissionOverrideOptions): Promise<ApiResult>;
}

export class ChannelSetPermissionsSubtag extends CompiledSubtag {
    readonly #setPermissionOverride: SetPermissionOverrideThunk;
    readonly #getUserPermissions: GetUserPermissionsThunk;
    public constructor({ setPermissionOverride, getUserPermissions }: {
        setPermissionOverride: SetPermissionOverrideThunk;
        getUserPermissions: GetUserPermissionsThunk;
    }) {
        super({
            name: 'channelSetPermissions',
            aliases: ['channelSetPerms'],
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'type', 'memberid|roleid'], //TODO allow member/role names
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, type, item]) => this.clearPerms(ctx, channel.value, type.value, item.value)
                },
                {
                    parameters: ['channel', 'type', 'memberid|roleid', 'allow', 'deny?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, type, entityId, allow, deny]) => this.setPerms(ctx, channel.value, type.value, entityId.value, parse.bigInt(allow.value), parse.bigInt(deny.value))
                }
            ]
        });
        this.#getUserPermissions = getUserPermissions;
        this.#setPermissionOverride = setPermissionOverride;
    }

    public async clearPerms(context: BBTagContext, channelStr: string, type: string, entityId: string): Promise<string> {
        const { authorizerPermissions: _, ...options } = await this.#resolve(context, channelStr, type, entityId);
        const result = await this.#setPermissionOverride(options);
        if (result.success)
            return options.channelId;
        throw new BBTagRuntimeError('Failed to edit channel: no perms', result.reason);
    }

    public async setPerms(context: BBTagContext, channelStr: string, type: string, entityId: string, allow: bigint = 0n, deny: bigint = 0n): Promise<string> {
        const { authorizerPermissions, ...options } = await this.#resolve(context, channelStr, type, entityId);
        if (!authorizerPermissions.has('ADMINISTRATOR') && !authorizerPermissions.has(allow | deny))
            throw new BBTagRuntimeError('Author missing requested permissions');
        const result = await this.#setPermissionOverride({
            ...options,
            allow,
            deny
        });
        if (result.success)
            return options.channelId;
        throw new BBTagRuntimeError('Failed to edit channel: no perms', result.reason);
    }

    async #resolve(context: BBTagContext, channelStr: string, type: string, entityId: string): Promise<SetPermissionOverrideOptionsBase & { authorizerPermissions: DiscordPermissions; }> {
        const channelId = await ChannelIdSubtag.query(context, channelStr);

        if (channelId === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (await ChannelIsThreadSubtag.check(context, channelId))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        const authorizerPermissions = await this.#getUserPermissions(context.root.guildId, context.root.authorizerId ?? context.root.guildOwnerId, channelId);
        if (!authorizerPermissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        return {
            guildId: context.root.guildId,
            channelId: channelId,
            entityId: entityId,
            type: this.#getOverwriteType(type),
            auditReason: context.auditReason(),
            authorizerPermissions
        };
    }

    #getOverwriteType(typeStr: string): PermissionOverwriteType {
        switch (typeStr) {
            case 'member': return PermissionOverwriteType.MEMBER;
            case 'role': return PermissionOverwriteType.ROLE;
            default: throw new BBTagRuntimeError('Type must be member or role');
        }
    }
}
