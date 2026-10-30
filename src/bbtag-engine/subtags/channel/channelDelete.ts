import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelDelete;

export interface DeleteChannelOptions {
    readonly guildId: string;
    readonly channelId: string;
    readonly auditReason: string;
}

export interface DeleteChannelFeature {
    deleteChannel(options: DeleteChannelOptions): Promise<ApiResult>;
}

type Features = DeleteChannelFeature & GetMemberPermissionsFeature;
export class ChannelDeleteSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channelDelete',
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
        this.#features = features;
    }

    public async deleteChannel(context: BBTagContext, channelStr: string): Promise<void> {
        const channelId = await ChannelIdSubtag.query(context, channelStr)
            /**
             * TODO change this to "No channel found" for consistency
             * when versioning is out and about
             */
            ?? new BBTagRuntimeError('Channel does not exist').throw();

        const permissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId, channelId);
        if (!permissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const result = await this.#features.deleteChannel({
            guildId: context.root.guildId,
            channelId,
            auditReason: await ReasonSubtag.get(context)
        });
        if (!result.success)
            throw new BBTagRuntimeError('Failed to edit channel: no perms', result.reason);
    }
}
