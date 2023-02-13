import express, { asyncHandler } from '@blargbot/express';

import type { DiscordMessageCacheService } from './DiscordMessageCacheService.js';

export function createMessageCacheRequestHandler(service: DiscordMessageCacheService): express.RequestHandler {
    const router = express.Router();

    router.route('/:channelId(\\d+)/last-message-id')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getLastMessageId(BigInt(req.params.channelId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result);
        }));

    return router;
}
