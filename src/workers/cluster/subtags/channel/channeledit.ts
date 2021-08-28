import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { discordUtil, mapping, SubtagType } from '@cluster/utils';
import { TypeMapping } from '@core/types';
import { guard } from '@core/utils';
import { ChannelData, GuildChannels, ThreadEditData } from 'discord.js';

export class ChannelEditSubtag extends BaseSubtag {
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
                    execute: (ctx, args, subtag) => this.channelEdit(ctx, [...args.map(arg => arg.value), '{}'], subtag)
                }
            ]
        });
    }

    public async channelEdit(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const channel = await context.queryChannel(args[0]);

        if (channel === undefined)
            return this.customError('Channel does not exist', context, subtag);//TODO no channel found error

        const permission = channel.permissionsFor(context.authorizer);

        if (permission?.has('MANAGE_CHANNELS') !== true)
            return this.customError('Author cannot edit this channel', context, subtag);

        return guard.isThreadChannel(channel)
            ? await this.channelEditCore(context, channel, args[1], mapThreadOptions, subtag)
            : await this.channelEditCore(context, channel, args[1], mapChannelOptions, subtag);
    }

    private async channelEditCore<T>(
        context: BBTagContext,
        channel: Extract<GuildChannels, { edit(data: T, fullReason?: string): Promise<unknown>; }>,
        editJson: string,
        mapping: TypeMapping<T>,
        subtag: SubtagCall
    ): Promise<string> {
        let options: T;
        try {
            const mapped = mapping(editJson);
            if (!mapped.valid)
                return this.customError('Invalid JSON', context, subtag);
            options = mapped.value;
        } catch (e: unknown) {
            return this.customError('Invalid JSON', context, subtag);
        }

        try {
            const fullReason = discordUtil.formatAuditReason(
                context.user,
                context.scope.reason ?? ''
            );
            await channel.edit(options, fullReason);
            return channel.id;
        } catch (err: unknown) {
            context.logger.error(err);
            return this.customError('Failed to edit channel: no perms', context, subtag);
        }
    }
}

const mapChannelOptions = mapping.mapJson(
    mapping.mapObject<ChannelData>({
        bitrate: mapping.mapOptionalNumber,
        name: mapping.mapOptionalString,
        nsfw: mapping.mapOptionalBoolean,
        parent: ['parentID', mapping.mapOptionalString],
        rateLimitPerUser: mapping.mapOptionalNumber,
        topic: mapping.mapOptionalString,
        userLimit: mapping.mapOptionalNumber,
        defaultAutoArchiveDuration: mapping.mapIn(60, 1440, 4320, 10080, undefined),
        lockPermissions: mapping.mapOptionalBoolean,
        permissionOverwrites: [undefined],
        position: mapping.mapOptionalNumber,
        rtcRegion: [undefined],
        type: [undefined]
    })
);

const mapThreadOptions = mapping.mapJson(
    mapping.mapObject<ThreadEditData>({
        archived: mapping.mapOptionalBoolean,
        autoArchiveDuration: mapping.mapIn(60, 1440, 4320, 10080, undefined),
        locked: mapping.mapOptionalBoolean,
        name: mapping.mapOptionalString,
        rateLimitPerUser: mapping.mapOptionalNumber
    })
);
