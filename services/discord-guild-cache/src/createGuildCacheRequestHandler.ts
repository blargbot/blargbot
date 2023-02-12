import express, { asyncHandler } from '@blargbot/express';

import type { DiscordGuildCacheService } from './DiscordGuildCacheService.js';

export function createGuildCacheRequestHandler(service: DiscordGuildCacheService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getGuild(BigInt(req.params.guildId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result);
        }));

    router.route('/')
        .get(asyncHandler(async (_, res) => {
            const guildCount = await service.getGuildCount();
            res.status(200).send({ guildCount });
        }))
        .delete(asyncHandler(async (_, res) => {
            await service.deleteAllGuilds();
            res.status(204).end();
        }));

    return router;
}
