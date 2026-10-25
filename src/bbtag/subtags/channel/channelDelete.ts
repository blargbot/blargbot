import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult, GetUserPermissionsThunk } from '../types.js';
import { ChannelIdSubtag } from './channelId.js';

const tag = templates.subtags.channelDelete;

export interface DeleteChannelThunk {
    (guildId: string, channelId: string, auditReason: string): Promise<ApiResult>;
}

export class ChannelDeleteSubtag extends CompiledSubtag {
    readonly #getUserPermissions: GetUserPermissionsThunk;
    readonly #deleteChannel: DeleteChannelThunk;
    public constructor({ getUserPermissions, deleteChannel }: {
        deleteChannel: DeleteChannelThunk;
        getUserPermissions: GetUserPermissionsThunk;
    }) {
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
        this.#deleteChannel = deleteChannel;
        this.#getUserPermissions = getUserPermissions;
    }

    public async deleteChannel(context: BBTagContext, channelStr: string): Promise<void> {
        const channelId = await ChannelIdSubtag.query(context, channelStr)
            /**
             * TODO change this to "No channel found" for consistency
             * when versioning is out and about
             */
            ?? new BBTagRuntimeError('Channel does not exist').throw();

        const permissions = await this.#getUserPermissions(context.root.guildId, context.root.authorizerId ?? context.root.guildOwnerId, channelId);
        if (!permissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const result = await this.#deleteChannel(context.root.guildId, channelId, context.auditReason());
        if (!result.success)
            throw new BBTagRuntimeError('Failed to edit channel: no perms', result.reason);
    }
}
