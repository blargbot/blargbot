import express, { asyncHandler } from '@blargbot/express';

import type { DiscordPresenceCacheService } from './DiscordPresenceCacheService.js';

export function createPresenceCacheRequestHandler(service: DiscordPresenceCacheService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)/:userId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getPresence(BigInt(req.params.guildId), BigInt(req.params.userId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result);
        }));

    router.route('/:guildId(\\d+)')
        .delete(asyncHandler(async (req, res) => {
            await service.clear(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    router.route('/')
        .delete(asyncHandler(async (_, res) => {
            await service.clear();
            res.status(204).end();
        }));

    return router;
}
