import Discord from '@blargbot/discord-types';
import { hasFlag } from '@blargbot/guards';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelDelete;

@Subtag.names('channelDelete')
@Subtag.ctorArgs('channel')
export class ChannelDeleteSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;

    public constructor(channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['id'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [channel]) => this.deleteChannel(ctx, channel.value)
                }
            ]
        });

        this.#channels = channels;
    }

    public async deleteChannel(context: BBTagContext, channelStr: string): Promise<void> {
        const channel = await this.#channels.querySingle(context, channelStr);

        /**
         * TODO change this to "No channel found" for consistency
         * * when versioning is out and about
         */
        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');

        const permission = context.getPermission(context.authorizer, channel);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageChannels))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const result = await this.#channels.delete(context, channel.id);

        if (result === undefined)
            return;

        throw new BBTagRuntimeError('Failed to edit channel: no perms', result.error);
    }
}
