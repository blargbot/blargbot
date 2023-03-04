import express, { asyncHandler } from '@blargbot/express';
import { json } from '@blargbot/serialization';

import type { TimeoutRecord } from './TimeoutDetails.js';
import { timeoutRecordSerializerOpts } from './TimeoutDetails.js';
import type { TimeoutService } from './TimeoutService.js';

export function createTimeoutRequestHandler(service: TimeoutService): express.RequestHandler {
    const router = express.Router();

    router.route('/:ownerId(\\d+)/timers')
        .get(asyncHandler(async (req, res): Promise<void> => {
            const offset = Number(req.query.offset ?? '0');
            const count = Number(req.query.count ?? '10');
            if (isNaN(offset) || offset < 0)
                return void res.status(400).send({ error: 'Invalid offset' });
            if (isNaN(count) || count <= 0)
                return void res.status(400).send({ error: 'Invalid count' });
            const ownerId = BigInt(req.params.ownerId);
            const [timers, total] = await Promise.all([
                service.listTimeout(ownerId, offset, count),
                service.countTimeout(ownerId)
            ]);
            res.status(200).send({ timers, total });
        }))
        .post(asyncHandler(async (req, res): Promise<void> => {
            const body = mapCreate.fromJson(req.body as JToken | undefined);
            if (!body.success)
                return void res.status(400).send({ error: 'Invalid request body' });

            const id = await service.createTimeout({
                ...body.value,
                ownerId: BigInt(req.params.ownerId)
            });
            res.status(200).send({ id });
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.clearTimeout(BigInt(req.params.ownerId));
            res.status(204).end();
        }));

    router.route('/:ownerId(\\d+)/timers/:timerId')
        .get(asyncHandler(async (req, res): Promise<void> => {
            const result = await service.getTimeout(BigInt(req.params.ownerId), req.params.timerId);
            if (result === undefined)
                return void res.status(404).end();
            res.status(200).send(result);
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteTimeout(BigInt(req.params.ownerId), req.params.timerId);
            res.status(204).end();
        }));

    return router;
}

const { id, ownerId, ...createSerializerOpts } = timeoutRecordSerializerOpts;
const mapCreate = json.object<Omit<TimeoutRecord, 'id' | 'ownerId'>>(createSerializerOpts);
