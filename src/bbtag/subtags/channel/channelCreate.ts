import { guard, zodStringToJson } from '@blargbot/core';
import * as eris from 'eris';
import z from 'zod';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channelCreate;

export class ChannelCreateSubtag extends CompiledSubtag {
    public constructor() {
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
    }

    public async channelCreate(
        context: BBTagContext,
        name: string,
        typeKey: string,
        optionsJson: string
    ): Promise<string> {
        if (!context.hasPermission('manageChannels'))
            throw new BBTagRuntimeError('Author cannot create channels');

        const mapped = mapOptions.safeParse(optionsJson);
        if (!mapped.success)
            throw new BBTagRuntimeError('Invalid JSON');
        const options = mapped.data;

        const type = guard.hasProperty(channelTypes, typeKey) ? channelTypes[typeKey] : eris.Constants.ChannelTypes.GUILD_TEXT;

        for (const permission of options.permissionOverwrites ?? [])
            if (!context.hasPermission(permission.allow | permission.deny))
                throw new BBTagRuntimeError('Author missing requested permissions');

        try {
            if (options.reason === '') options.reason = undefined;
            options.reason ??= context.auditReason();
            const channel = await context.guild.createChannel(name, type, options);
            return channel.id;
        } catch (err: unknown) {
            if (!(err instanceof eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to create channel: no perms', err.message);
        }
    }
}

const channelTypes = {
    text: eris.Constants.ChannelTypes.GUILD_TEXT,
    voice: eris.Constants.ChannelTypes.GUILD_VOICE,
    category: eris.Constants.ChannelTypes.GUILD_CATEGORY,
    news: eris.Constants.ChannelTypes.GUILD_NEWS,
    store: eris.Constants.ChannelTypes.GUILD_STORE
} as const;

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

const mapOptions = zodStringToJson.pipe(z.object({
    bitrate: numberish.optional(),
    nsfw: booleanish.optional(),
    parentID: z.string().optional(),
    rateLimitPerUser: numberish.optional(),
    topic: z.string().optional(),
    userLimit: numberish.optional(),
    permissionOverwrites: z.object({
        allow: bigintish.optional().default(0n),
        deny: bigintish.optional().default(0n),
        id: z.string(),
        type: z.enum(['role', 'member'])
            .transform(v => v === 'member' ? 'user' : v)
            .transform(v => eris.Constants.PermissionOverwriteTypes[v.toUpperCase()])
    }).array().optional(),
    reason: z.string().optional()
}));
