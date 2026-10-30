import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToInteger } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { GetMemberPermissionsFeature } from '../types.js';
import type { EditChannelFeature } from './channelEdit.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelSetPosition;

type Features = GetMemberPermissionsFeature & EditChannelFeature;
export class ChannelSetPositionSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channelSetPosition',
            aliases: ['channelSetPos'],
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
        this.#features = features;
    }

    public async setChannelPosition(context: BBTagContext, channelStr: string, posStr: string): Promise<void> {
        const channelId = await ChannelIdSubtag.query(context, channelStr);

        if (channelId === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO No channel found error

        const authorizerPermissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId, channelId);
        if (!authorizerPermissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot move this channel');

        const pos = convertToInteger(posStr);
        if (pos === undefined)
            throw new NotANumberError(posStr);

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?
        const result = await this.#features.editChannel({
            guildId: context.root.guildId,
            channelId,
            position: pos,
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return;

        throw new BBTagRuntimeError('Failed to move channel: no perms', result.reason);
    }
}
