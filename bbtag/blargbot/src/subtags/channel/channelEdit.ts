import Discord from '@blargbot/discord-types';
import { isThreadChannel } from '@blargbot/discord-util';
import { hasFlag } from '@blargbot/guards';
import { mapping } from '@blargbot/mapping';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { ChannelService } from '../../services/ChannelService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { Entities } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.channelEdit;

@Subtag.id('channelEdit')
@Subtag.ctorArgs('channels')
export class ChannelEditSubtag extends CompiledSubtag {
    readonly #channels: ChannelService;

    public constructor(channels: ChannelService) {
        super({
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'options?:{}'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [channel, options]) => this.channelEdit(ctx, channel.value, options.value)
                }
            ]
        });

        this.#channels = channels;
    }

    public async channelEdit(
        context: BBTagScript,
        channelStr: string,
        editJson: string
    ): Promise<string> {
        const channel = await this.#channels.querySingle(context.runtime, channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO no channel found error

        const permission = context.runtime.getPermission(context.runtime.authorizer, channel);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageChannels))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const mapping = isThreadChannel(channel) ? mapThreadOptions : mapChannelOptions;
        const mapped = mapping(editJson);
        if (!mapped.valid)
            throw new BBTagRuntimeError('Invalid JSON');

        const options = mapped.value;

        const result = await this.#channels.edit(context.runtime, channel.id, options);

        if (result === undefined)
            return channel.id;

        throw new BBTagRuntimeError('Failed to edit channel: no perms', result.error);
    }
}

const defaultAutoArchiveDurationMapping = mapping.in(...[60, 1440, 4320, 10080, undefined] as const);

const mapChannelOptions = mapping.json(
    mapping.object<Entities.EditChannel>({
        bitrate: mapping.number.optional,
        name: mapping.string.optional,
        nsfw: mapping.boolean.optional,
        parentID: mapping.string.optional,
        rateLimitPerUser: mapping.number.optional,
        topic: mapping.string.optional,
        userLimit: mapping.number.optional,
        defaultAutoArchiveDuration: mapping.number.chain(defaultAutoArchiveDurationMapping).optional,
        locked: mapping.boolean.optional,
        rtcRegion: [undefined],
        archived: [undefined],
        autoArchiveDuration: [undefined],
        icon: [undefined],
        invitable: [undefined],
        ownerID: [undefined],
        videoQualityMode: [undefined],
        position: [undefined]
    })
);

const mapThreadOptions = mapping.json(
    mapping.object<Entities.EditChannel>({
        archived: mapping.boolean.optional,
        autoArchiveDuration: mapping.number.chain(defaultAutoArchiveDurationMapping).optional,
        locked: mapping.boolean.optional,
        name: mapping.string.optional,
        rateLimitPerUser: mapping.number.optional,
        invitable: mapping.boolean.optional,
        bitrate: [undefined],
        defaultAutoArchiveDuration: [undefined],
        icon: [undefined],
        nsfw: [undefined],
        ownerID: [undefined],
        parentID: [undefined],
        rtcRegion: [undefined],
        topic: [undefined],
        userLimit: [undefined],
        videoQualityMode: [undefined],
        position: [undefined]
    })
);
