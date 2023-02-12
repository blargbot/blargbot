import express, { asyncHandler } from '@blargbot/express';

import type { DiscordRoleCacheService } from './DiscordRoleCacheService.js';

export function createRoleCacheRequestHandler(service: DiscordRoleCacheService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)/:roleId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getRole(BigInt(req.params.guildId), BigInt(req.params.roleId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result);
        }));

    router.route('/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getAllRoles(BigInt(req.params.guildId));
            res.status(200).send(result);
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteAllRoles(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    router.route('/')
        .delete(asyncHandler(async (_, res) => {
            await service.deleteAllRoles();
            res.status(204).end();
        }));

    return router;
}
