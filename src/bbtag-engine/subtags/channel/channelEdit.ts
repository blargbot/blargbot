import z from 'zod';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { zodStringToJson } from '../../utils/zodStringToJson.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
import { ChannelIdSubtag } from './channelId.js';
import { ChannelIsThreadSubtag } from './channelIsThread.js';

const tag = templates.subtags.channelEdit;

export type EditChannelOptions = (z.infer<typeof mapThreadOptions> | z.infer<typeof mapChannelOptions> & { position?: number; }) & {
    guildId: string;
    channelId: string;
    auditReason: string;
};
export interface EditChannelFeature {
    editChannel(options: EditChannelOptions): Promise<ApiResult>;
}

type Features = EditChannelFeature & GetMemberPermissionsFeature
export class ChannelEditSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async channelEdit(context: BBTagContext, channelStr: string, editJson: string): Promise<string> {
        const channelId = await ChannelIdSubtag.query(context, channelStr)
            ?? new BBTagRuntimeError('Channel does not exist').throw();//TODO no channel found error

        const authorizerPermissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId, channelId);
        if (!authorizerPermissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot edit this channel');

        const mapping = await ChannelIsThreadSubtag.check(context, channelId) ? mapThreadOptions : mapChannelOptions;
        const mapped = mapping.safeParse(editJson);
        if (!mapped.success)
            throw new BBTagRuntimeError('Invalid JSON');

        const result = await this.#features.editChannel({
            ...mapped.data,
            guildId: context.root.guildId,
            channelId,
            auditReason: await ReasonSubtag.get(context)
        });
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
