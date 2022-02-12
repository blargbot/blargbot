import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { mapping, SubtagType } from '@cluster/utils';
import { guard } from '@core/utils';
import { ApiError, DiscordRESTError, EditChannelOptions } from 'eris';

export class ChannelEditSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'channeledit',
            category: SubtagType.CHANNEL,
            definition: [
                {
                    parameters: ['channel', 'options?:{}'],
                    description: 'Edits a channel with the given information.\n' +
                        '`options` is a JSON object, containing any or all of the following properties:\n' +
                        '- `name`\n' +
                        '- `topic`\n' +
                        '- `nsfw`\n' +
                        '- `parentID`\n' +
                        '- `reason` (displayed in audit log)\n' +
                        '- `rateLimitPerUser`\n' +
                        '- `bitrate` (voice)\n' +
                        '- `userLimit` (voice)\n' +
                        'Returns the channel\'s ID.',
                    exampleCode: '{channeledit;11111111111111111;{j;{"name": "super-cool-channel"}}}',
                    exampleOut: '11111111111111111',
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
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError(`Failed to edit channel: ${err.code === ApiError.MISSING_PERMISSIONS ? 'no perms' : err.message}`);
        }
    }
}

const mapChannelOptions = mapping.json(
    mapping.object<EditChannelOptions>({
        bitrate: mapping.number.optional,
        name: mapping.string.optional,
        nsfw: mapping.boolean.optional,
        parentID: mapping.string.optional,
        rateLimitPerUser: mapping.number.optional,
        topic: mapping.string.optional,
        userLimit: mapping.number.optional,
        defaultAutoArchiveDuration: mapping.in(60, 1440, 4320, 10080, undefined),
        locked: mapping.boolean.optional,
        rtcRegion: [undefined],
        archived: [undefined],
        autoArchiveDuration: [undefined],
        icon: [undefined],
        invitable: [undefined],
        ownerID: [undefined],
        videoQualityMode: [undefined]
    })
);

const mapThreadOptions = mapping.json(
    mapping.object<EditChannelOptions>({
        archived: mapping.boolean.optional,
        autoArchiveDuration: mapping.in(60, 1440, 4320, 10080, undefined),
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
        videoQualityMode: [undefined]
    })
);
