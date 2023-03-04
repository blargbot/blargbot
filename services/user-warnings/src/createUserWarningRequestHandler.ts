import express, { asyncHandler } from '@blargbot/express';
import { mapping } from '@blargbot/mapping';

import type { UserWarningService } from './UserWarningService.js';

export function createModLogRequestHandler(service: UserWarningService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)')
        .delete(asyncHandler(async (req, res) => {
            await service.clearWarnings(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    router.route('/:guildId(\\d+)/:userId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const count = await service.getWarnings(BigInt(req.params.guildId), BigInt(req.params.userId));
            res.status(200).send({ count });
        }))
        .patch(asyncHandler(async (req, res) => {
            const mapped = mapUpdate(req.body);
            if (!mapped.valid) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            const result = await service.addWarnings(BigInt(req.params.guildId), BigInt(req.params.userId), mapped.value.assign);
            res.status(200).send(result);
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.clearWarnings(BigInt(req.params.guildId), BigInt(req.params.userId));
            res.status(204).end();
        }));

    return router;
}

const mapUpdate = mapping.object({
    assign: mapping.number
});
