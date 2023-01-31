import { guard } from '@blargbot/core/utils/index.js';
import { hasFlag } from '@blargbot/guards';
import { OverwriteType } from 'discord-api-types/v10';
import * as Discord from 'discord-api-types/v10';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { Entities } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelSetPermissions;

@Subtag.names('channelSetPermissions', 'channelSetPerms')
@Subtag.ctorArgs(Subtag.converter(), Subtag.service('channel'))
export class ChannelSetPermissionsSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #channels: ChannelService;

    public constructor(converter: BBTagValueConverter, channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'type', 'memberid|roleid'], //TODO allow member/role names
                    description: tag.current.description,
                    exampleCode: tag.current.exampleCode,
                    exampleOut: tag.current.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, type, item]) => this.channelSetPerms(ctx, channel.value, type.value, item.value, undefined, undefined)
                },
                {
                    parameters: ['channel', 'type', 'memberid|roleid', 'allow', 'deny?'],
                    description: tag.channel.description,
                    exampleCode: tag.channel.exampleCode,
                    exampleOut: tag.channel.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, type, entityId, allow, deny]) => this.channelSetPerms(ctx, channel.value, type.value, entityId.value, this.#converter.bigInt(allow.value), this.#converter.bigInt(deny.value))
                }
            ]
        });

        this.#converter = converter;
        this.#channels = channels;
    }

    public async channelSetPerms(
        context: BBTagContext,
        channelStr: string,
        typeStr: string,
        entityId: string,
        allow = 0n,
        deny = 0n
    ): Promise<string> {
        const channel = await this.#channels.querySingle(context, channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        const permission = context.getPermission(context.authorizer, channel);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageChannels))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        if (!hasFlag(permission, allow | deny))
            throw new BBTagRuntimeError('Author missing requested permissions');

        const type = this.#getOverwriteType(typeStr);

        const result = await this.#channels.setPermission(context, channel.id, {
            id: entityId,
            allow: allow.toString(),
            deny: deny.toString(),
            type
        });

        if (result === undefined)
            return channel.id;

        throw new BBTagRuntimeError('Failed to edit channel: no perms', result.error);
    }

    #getOverwriteType(typeStr: string): Entities.PermissionOverwrite['type'] {
        switch (typeStr) {
            case 'member': return OverwriteType.Member;
            case 'role': return OverwriteType.Role;
            default: throw new BBTagRuntimeError('Type must be member or role');
        }
    }
}
