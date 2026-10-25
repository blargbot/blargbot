import { zodStringToJson } from '@blargbot/core';
import z from 'zod';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult, GetUserPermissionsThunk } from '../types.js';
import { ChannelIdSubtag } from './channelId.js';
import { ChannelIsThreadSubtag } from './channelIsThread.js';

const tag = templates.subtags.channelEdit;

export type EditChannelOptions = (z.infer<typeof mapThreadOptions> | z.infer<typeof mapChannelOptions> & { position?: number; }) & { auditReason: string; };
export interface EditChannelThunk {
    (guildId: string, channelId: string, options: EditChannelOptions): Promise<ApiResult>;
}

export class ChannelEditSubtag extends CompiledSubtag {
    readonly #getUserPermissions: GetUserPermissionsThunk;
    readonly #editChannel: EditChannelThunk;
    public constructor({ getUserPermissions, editChannel }: {
        getUserPermissions: GetUserPermissionsThunk;
        editChannel: EditChannelThunk;
    }) {
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
        this.#getUserPermissions = getUserPermissions;
        this.#editChannel = editChannel;
    }

    public async channelEdit(context: BBTagContext, channelStr: string, editJson: string): Promise<string> {
        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new BBTagRuntimeError('Channel does not exist').throw();//TODO no channel found error

        const authorizerPermissions = await this.#getUserPermissions(context.root.guildId, context.root.authorizerId ?? context.root.guildOwnerId, channelId);
        if (!authorizerPermissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const mapping = await ChannelIsThreadSubtag.check(context, channelId) ? mapThreadOptions : mapChannelOptions;
        const mapped = mapping.safeParse(editJson);
        if (!mapped.success)
            throw new BBTagRuntimeError('Invalid JSON');

        const result = await this.#editChannel(context.root.guildId, channelId, { ...mapped.data, auditReason: context.auditReason() });
        if (result.success)
            return channelId;

        throw new BBTagRuntimeError('Failed to edit channel: no perms', result.reason);
    }
}

const numberish = z.union([
    z.number(),
    z.string().transform(v => parseFloat(v))
]).refine(v => !isNaN(v));
const booleanish = z.union([
    z.boolean(),
    z.enum(['true', 'false']).transform(v => v === 'true')
]);

const defaultAutoArchiveDurationMapping = z.enum({ a: 60, b: 1440, c: 4320, d: 10080 });

const mapChannelOptions = zodStringToJson.pipe(z.strictObject({
    bitrate: numberish.optional(),
    name: z.string().optional(),
    nsfw: booleanish.optional(),
    parentID: z.string().optional(),
    rateLimitPerUser: numberish.optional(),
    topic: z.string().optional(),
    userLimit: numberish.optional(),
    defaultAutoArchiveDuration: numberish.pipe(defaultAutoArchiveDurationMapping).optional(),
    locked: booleanish.optional()
}));
const mapThreadOptions = zodStringToJson.pipe(z.strictObject({
    archived: booleanish.optional(),
    autoArchiveDuration: numberish.pipe(defaultAutoArchiveDurationMapping).optional(),
    locked: booleanish.optional(),
    name: z.string().optional(),
    rateLimitPerUser: numberish.optional(),
    invitable: booleanish.optional()
}));
