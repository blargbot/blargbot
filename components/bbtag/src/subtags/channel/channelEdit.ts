import { guard } from '@blargbot/core/utils/index.js';
import { mapping } from '@blargbot/mapping';
import * as Eris from 'eris';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channelEdit;

export class ChannelEditSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'channelEdit',
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
    }

    public async channelEdit(
        context: BBTagContext,
        channelStr: string,
        editJson: string
    ): Promise<string> {
        const channel = await context.queryChannel(channelStr);

        if (channel === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO no channel found error

        if (!context.hasPermission(channel, 'manageChannels'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const mapping = guard.isThreadChannel(channel) ? mapThreadOptions : mapChannelOptions;
        const mapped = mapping(editJson);
        if (!mapped.valid)
            throw new BBTagRuntimeError('Invalid JSON');

        const options = mapped.value;
        try {
            await channel.edit(options, context.auditReason());
            return channel.id;
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to edit channel: no perms', err.message);
        }
    }
}

const defaultAutoArchiveDurationMapping = mapping.in(...[60, 1440, 4320, 10080, undefined] as const);

const mapChannelOptions = mapping.json(
    mapping.object<Eris.EditChannelOptions>({
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
        position: [undefined],
        permissionOverwrites: [undefined]
    })
);

const mapThreadOptions = mapping.json(
    mapping.object<Eris.EditChannelOptions>({
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
        position: [undefined],
        permissionOverwrites: [undefined]
    })
);
