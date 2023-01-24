import { guard } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channelSetPermissions;

@Subtag.id('channelSetPermissions', 'channelSetPerms')
@Subtag.ctorArgs(Subtag.converter())
export class ChannelSetPermissionsSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
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
    }

    public async channelSetPerms(
        context: BBTagContext,
        channelStr: string,
        typeStr: string,
        entityId: string,
        allow = 0n,
        deny = 0n
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist'); //TODO No channel found error

        if (guard.isThreadChannel(channel))
            throw new BBTagRuntimeError('Cannot set permissions for a thread channel');

        if (!context.hasPermission(channel, 'manageChannels'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        if (!context.hasPermission(channel, allow | deny))
            throw new BBTagRuntimeError('Author missing requested permissions');

        const type = this.#getOverwriteType(typeStr);
        try {
            if (allow !== 0n || deny !== 0n)
                await channel.editPermission(entityId, allow, deny, type, context.auditReason());
            else
                await channel.deletePermission(entityId, context.auditReason());

            return channel.id;
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to edit channel: no perms', err.message);
        }
    }

    #getOverwriteType(typeStr: string): Eris.Constants['PermissionOverwriteTypes'][keyof Eris.Constants['PermissionOverwriteTypes']] {

        switch (typeStr) {
            case 'member': return Eris.Constants.PermissionOverwriteTypes.USER;
            case 'role': return Eris.Constants.PermissionOverwriteTypes.ROLE;
            default: throw new BBTagRuntimeError('Type must be member or role');
        }
    }
}
