import express, { asyncHandler } from '@blargbot/express';

import type { DiscordMemberCacheService } from './DiscordMemberCacheService.js';

export function createMemberCacheRequestHandler(service: DiscordMemberCacheService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)/:userId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getMember(BigInt(req.params.guildId), BigInt(req.params.userId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result);
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteAllMembers(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    router.route('/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getAllMembers(BigInt(req.params.guildId));
            res.status(200).send(result);
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteAllMembers(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    router.route('/')
        .delete(asyncHandler(async (_, res) => {
            await service.deleteAllMembers();
            res.status(204).end();
        }));

    return router;
}
