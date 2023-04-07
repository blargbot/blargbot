import express, { asyncHandler } from '@blargbot/express';
import type { UserWarningsResponse, UserWarningsUpdateResponse } from '@blargbot/user-warnings-client';
import { userWarningsUpdateRequestBodySerializer } from '@blargbot/user-warnings-client';

import type { UserWarningService } from './UserWarningService.js';

export function createUserWarningRequestHandler(service: UserWarningService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)')
        .delete(asyncHandler(async (req, res) => {
            await service.clearWarnings(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    router.route('/:guildId(\\d+)/:userId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const count = await service.getWarnings(BigInt(req.params.guildId), BigInt(req.params.userId));
            res.status(200).send({ count } satisfies UserWarningsResponse);
        }))
        .patch(asyncHandler(async (req, res) => {
            const mapped = await userWarningsUpdateRequestBodySerializer.fromJson(req.body as JToken);
            if (!mapped.success) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            const result = await service.addWarnings(BigInt(req.params.guildId), BigInt(req.params.userId), mapped.value);
            res.status(200).send(result satisfies UserWarningsUpdateResponse);
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.clearWarnings(BigInt(req.params.guildId), BigInt(req.params.userId));
            res.status(204).end();
        }));

    return router;
}
