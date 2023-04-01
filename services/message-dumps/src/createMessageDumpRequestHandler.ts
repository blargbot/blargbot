import express, { asyncHandler } from '@blargbot/express';
import { messageDumpSerializer } from '@blargbot/message-dumps-client';

import type { MessageDumpService } from './MessageDumpService.js';

export function createMessageDumpRequestHandler(service: MessageDumpService): express.RequestHandler {
    const router = express.Router();

    router.route('/:messageId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const message = await service.getMessageDump(BigInt(req.params.messageId));
            if (message === undefined)
                return void res.status(404).end();
            return void res.status(200)
                .contentType('application/json')
                .end(await messageDumpSerializer.write(message));
        }));
    router.route('/')
        .post(asyncHandler(async (req, res) => {
            const mapped = await messageDumpSerializer.fromJson(req.body as JToken);
            if (!mapped.success) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            await service.addMessageDump(mapped.value);
            res.status(204).end();
        }));

    return router;
}
