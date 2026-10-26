import { guard, zodStringToJson } from '@blargbot/core';
import z from 'zod';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { ChannelType, PermissionOverwriteType } from '../../enums.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';
import type { ChannelTypeSubtag } from './channelType.js';

const tag = templates.subtags.channelCreate;

export interface CreateChannelOptions extends z.infer<typeof mapOptions> {
    type: typeof channelTypes[keyof typeof channelTypes];
    name: string;
};
export type CreateChannelResult = ApiResult<{ channelId: string; }>
export interface CreateChannelFeature {
    createChannel(guildId: string, options: CreateChannelOptions): Promise<CreateChannelResult>;
}

type Features = CreateChannelFeature & GetMemberPermissionsFeature;
export class ChannelCreateSubtag extends CompiledSubtag {
    public static get channelTypes(): ReadonlyArray<keyof typeof channelTypes> {
        return Object.keys(channelTypes);
    }
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'channelCreate',
            category: SubtagType.CHANNEL,
            description: tag.description,
            definition: [
                {
                    parameters: ['name', 'type?:text', 'options?:{}'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [name, type, options]) => this.channelCreate(ctx, name.value, type.value, options.value)
                }
            ]
        });
        this.#features = features;
    }

    public async channelCreate(context: BBTagContext, name: string, typeKey: string, optionsJson: string): Promise<string> {
        const authorizerPermissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId ?? context.root.guildOwnerId);
        if (!authorizerPermissions.hasAny('MANAGE_CHANNELS', 'ADMINISTRATOR'))
            throw new BBTagRuntimeError('Author cannot create channels');

        const mapped = mapOptions.safeParse(optionsJson);
        if (!mapped.success)
            throw new BBTagRuntimeError('Invalid JSON');
        const options = mapped.data;

        const type = guard.hasProperty(channelTypes, typeKey) ? channelTypes[typeKey] : ChannelType.GUILD_TEXT;

        if (!authorizerPermissions.has('ADMINISTRATOR')) {
            for (const permission of options.permissionOverwrites ?? [])
                if (!authorizerPermissions.has(permission.allow | permission.deny))
                    throw new BBTagRuntimeError('Author missing requested permissions');
        }

        if (options.reason === '') options.reason = undefined;
        options.reason ??= context.auditReason();
        const result = await this.#features.createChannel(context.root.guildId, { ...options, type, name });
        if (result.success)
            return result.channelId;

        throw new BBTagRuntimeError('Failed to create channel: no perms', result.reason);
    }
}

const channelTypeMap = {
    [ChannelType.GUILD_TEXT]: 'text',
    [ChannelType.DM]: null,
    [ChannelType.GUILD_VOICE]: 'voice',
    [ChannelType.GROUP_DM]: null,
    [ChannelType.GUILD_CATEGORY]: 'category',
    [ChannelType.GUILD_ANNOUNCEMENT]: 'news',
    [ChannelType.ANNOUNCEMENT_THREAD]: null,
    [ChannelType.PUBLIC_THREAD]: null,
    [ChannelType.PRIVATE_THREAD]: null,
    [ChannelType.GUILD_STAGE_VOICE]: 'stage-voice',
    [ChannelType.GUILD_DIRECTORY]: 'directory',
    [ChannelType.GUILD_FORUM]: 'forum',
    [ChannelType.GUILD_MEDIA]: 'media'
} as const satisfies { [P in ChannelType]: typeof ChannelTypeSubtag.typeMap[P] | null };
const channelTypes = {} as Record<typeof channelTypeMap[keyof typeof channelTypeMap] & string, ChannelType>;
for (const key of Object.keys(channelTypeMap)) {
    const value = channelTypeMap[key];
    if (value !== null)
        channelTypes[value] = toNumber(key);
}

function toNumber<T extends `${number}`>(value: T): T extends `${infer value extends number}` ? value : never {
    return Number(value) as never;
}
const numberish = z.union([
    z.number(),
    z.string().transform(v => parseFloat(v))
]).refine(v => !isNaN(v));
const booleanish = z.union([
    z.boolean(),
    z.enum(['true', 'false']).transform(v => v === 'true')
]);
const bigintish = z.string()
    .regex(/^\d+$/)
    .transform(BigInt);

const mapOptions = zodStringToJson.pipe(z.strictObject({
    bitrate: numberish.optional(),
    nsfw: booleanish.optional(),
    parentID: z.string().optional(),
    rateLimitPerUser: numberish.optional(),
    topic: z.string().optional(),
    userLimit: numberish.optional(),
    permissionOverwrites: z.strictObject({
        allow: bigintish.optional().default(0n),
        deny: bigintish.optional().default(0n),
        id: z.string(),
        type: z.enum(['role', 'member'])
            .transform(v => PermissionOverwriteType[v.toUpperCase()])
    }).array().optional(),
    reason: z.string().optional()
}));
