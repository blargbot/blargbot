import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { GetUserPermissionsThunk } from '../types.js';
import type { EditChannelThunk } from './channelEdit.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelSetPosition;

export class ChannelSetPositionSubtag extends CompiledSubtag {
    readonly #editChannel: EditChannelThunk;
    readonly #getUserPermissions: GetUserPermissionsThunk;
    public constructor({ editChannel, getUserPermissions }: {
        editChannel: EditChannelThunk;
        getUserPermissions: GetUserPermissionsThunk;
    }) {
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
        this.#getUserPermissions = getUserPermissions;
        this.#editChannel = editChannel;
    }

    public async setChannelPosition(context: BBTagContext, channelStr: string, posStr: string): Promise<void> {
        const channelId = await ChannelIdSubtag.query(context, channelStr);

        if (channelId === undefined)
            throw new BBTagRuntimeError('Channel does not exist');//TODO No channel found error

        const authorizerPermissions = await this.#getUserPermissions(context.root.guildId, context.root.authorizerId ?? context.root.guildOwnerId, channelId);
        if (!authorizerPermissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot move this channel');

        const pos = parse.int(posStr);
        if (pos === undefined)
            throw new NotANumberError(posStr);

        //TODO maybe check if the position doesn't exceed any bounds? Like amount of channels / greater than -1?
        const result = await this.#editChannel(context.root.guildId, channelId, {
            position: pos,
            auditReason: context.auditReason()
        });
        if (result.success)
            return;

        throw new BBTagRuntimeError('Failed to move channel: no perms', result.reason);
    }
}
