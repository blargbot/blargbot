import z from 'zod';

import { amqpJsonCodec } from '../util.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ClusterStats = amqpJsonCodec(z.object({
    clusterId: z.string(),
    timestamp: z.number(),
    activeGroupId: z.string().optional(),
    shards: z.object({
        shardId: z.int().gte(0),
        totalShards: z.int().gte(0),
        groupIds: z.string().array(),
        latency: z.number().optional(),
        lastAck: z.number().optional(),
        lastBeat: z.number().optional(),
        interval: z.number(),
        guilds: z.number(),
        unavailableGuilds: z.number(),
        state: z.literal([
            'Connected',
            'Connecting',
            'Disconnected',
            'Unidentified',
            'Identifying',
            'Resuming',
            'Offline'
        ])
    }).array()
}));
export type ClusterStats = z.infer<typeof ClusterStats>
