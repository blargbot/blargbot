import { guard, zodStringToJson } from '@blargbot/core';
import * as eris from 'eris';
import z from 'zod';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.channelEdit;

export class ChannelEditSubtag extends CompiledSubtag {
    public constructor() {
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
        const mapped = mapping.safeParse(editJson);
        if (!mapped.success)
            throw new BBTagRuntimeError('Invalid JSON');

        const options = mapped.data;
        try {
            await channel.edit(options, context.auditReason());
            return channel.id;
        } catch (err: unknown) {
            if (!(err instanceof eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Failed to edit channel: no perms', err.message);
        }
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

const mapChannelOptions = zodStringToJson.pipe(z.object({
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
const mapThreadOptions = zodStringToJson.pipe(z.object({
    archived: booleanish.optional(),
    autoArchiveDuration: numberish.pipe(defaultAutoArchiveDurationMapping).optional(),
    locked: booleanish.optional(),
    name: z.string().optional(),
    rateLimitPerUser: numberish.optional(),
    invitable: booleanish.optional()
}));
