import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { DiscordPermissions } from '../../enums.js';
import { PermissionOverwriteType } from '../../enums.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToBigInt } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
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

export interface SetPermissionOverrideFeature {
    setPermissionOverride(options: SetPermissionOverrideOptions): Promise<ApiResult>;
}

type Features = SetPermissionOverrideFeature & GetMemberPermissionsFeature
export class ChannelSetPermissionsSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
                    execute: (ctx, [channel, type, entityId, allow, deny]) => this.setPerms(ctx, channel.value, type.value, entityId.value, convertToBigInt(allow.value), convertToBigInt(deny.value))
                }
            ]
        });
        this.#features = features;
    }

    public async clearPerms(context: BBTagContext, channelStr: string, type: string, entityId: string): Promise<string> {
        const { authorizerPermissions: _, ...options } = await this.#resolve(context, channelStr, type, entityId);
        const result = await this.#features.setPermissionOverride(options);
        if (result.success)
            return options.channelId;
        throw new BBTagRuntimeError('Failed to edit channel: no perms', result.reason);
    }

    public async setPerms(context: BBTagContext, channelStr: string, type: string, entityId: string, allow: bigint = 0n, deny: bigint = 0n): Promise<string> {
        const { authorizerPermissions, ...options } = await this.#resolve(context, channelStr, type, entityId);
        if (!authorizerPermissions.has('ADMINISTRATOR') && !authorizerPermissions.has(allow | deny))
            throw new BBTagRuntimeError('Author missing requested permissions');
        const result = await this.#features.setPermissionOverride({
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

        const authorizerPermissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId, channelId);
        if (!authorizerPermissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        return {
            guildId: context.root.guildId,
            channelId: channelId,
            entityId: entityId,
            type: this.#getOverwriteType(type),
            auditReason: await ReasonSubtag.get(context),
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
