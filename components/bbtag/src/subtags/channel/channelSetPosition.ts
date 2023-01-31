import { hasFlag } from '@blargbot/guards';
import * as Discord from 'discord-api-types/v10';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelSetPosition;

@Subtag.names('channelSetPosition', 'channelSetPos')
@Subtag.ctorArgs(Subtag.converter(), Subtag.service('channel'))
export class ChannelSetPositionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #channels: ChannelService;

    public constructor(converter: BBTagValueConverter, channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'position'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel, position]) => this.setChannelPosition(ctx, channel.value, position.value)
                }
            ]
        });

        this.#converter = converter;
        this.#channels = channels;
    }

    public async setChannelPosition(context: BBTagContext, channelStr: string, posStr: string): Promise<void> {
        const channel = await this.#channels.querySingle(context, channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO No channel found error

        const permission = context.getPermission(context.authorizer, channel);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageChannels))
            throw new BBTagRuntimeError('Author cannot move this channel');

        const pos = this.#converter.int(posStr);
        if (pos === undefined)
            throw new NotANumberError(posStr);

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?

        const result = await this.#channels.edit(context, channel.id, { position: pos });

        if (result === undefined)
            return;

        throw new BBTagRuntimeError('Failed to move channel: no perms', result.error);
    }
}
