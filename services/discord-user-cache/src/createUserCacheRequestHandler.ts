import type { UserCacheCountResponse, UserCacheUserResponse } from '@blargbot/discord-user-cache-client';
import express, { asyncHandler } from '@blargbot/express';

import type { DiscordUserCacheService } from './DiscordUserCacheService.js';

export function createUserCacheRequestHandler(service: DiscordUserCacheService): express.RequestHandler {
    const router = express.Router();

    router.route('/:userId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getUser(BigInt(req.params.userId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result satisfies UserCacheUserResponse);
        }));

    router.route('/@self')
        .get(asyncHandler(async (_, res) => {
            const result = await service.getSelf();
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result satisfies UserCacheUserResponse);
        }));

    router.route('/')
        .get(asyncHandler(async (_, res) => {
            const userCount = await service.getUserCount();
            res.status(200).send({ userCount } satisfies UserCacheCountResponse);
        }))
        .delete(asyncHandler(async (_, res) => {
            await service.clear();
            res.status(204).end();
        }));

    return router;
}
