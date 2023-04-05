import type { BBTagSource, BBTagSourceIndex } from '@blargbot/bbtag-source-client';
import express, { asyncHandler } from '@blargbot/express';
import { mapping } from '@blargbot/mapping';

import type { BBTagSourceService } from './BBTagSourceService.js';

export function createBBTagSourceRequestHandler(service: BBTagSourceService): express.RequestHandler {
    const router = express.Router();
    router.route('/:ownerId(\\d+)')
        .delete(asyncHandler(async (req, res) => {
            await service.deleteSource({
                ownerId: BigInt(req.params.ownerId)
            });
            return void res.status(204).end();
        }));
    router.route('/:ownerId(\\d+)/:type')
        .delete(asyncHandler(async (req, res) => {
            await service.deleteSource({
                ownerId: BigInt(req.params.ownerId),
                type: req.params.type
            });
            return void res.status(204).end();
        }));
    router.route('/:ownerId(\\d+)/:type/:name')
        .get(asyncHandler(async (req, res) => {
            const source = await service.getSource({
                ownerId: BigInt(req.params.ownerId),
                type: req.params.type,
                name: req.params.name
            });
            if (source === undefined)
                return void res.status(404).end();
            return void res.status(200).json(source);
        }))
        .put(asyncHandler(async (req, res) => {
            const update = mapUpdate(req.body);
            if (!update.valid)
                return void res.status(400).json({ error: 'Invalid request body' });

            const target = {
                ownerId: BigInt(req.params.ownerId),
                type: req.params.type,
                name: req.params.name
            };

            if ('ownerId' in update.value)
                await service.alias(target, update.value);
            else if (!await service.setSource(target, update.value))
                return void res.status(404).json({ error: 'Unknown source' });

            return void res.status(204).end();
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteSource({
                ownerId: BigInt(req.params.ownerId),
                type: req.params.type,
                name: req.params.name
            });
            return void res.status(204).end();
        }));

    return router;
}

const mapUpdate = mapping.choice(
    mapping.object<Partial<BBTagSource>>({
        value: mapping.string.optional,
        cooldown: mapping.number.optional
    }),
    mapping.object<BBTagSourceIndex>({
        name: mapping.string,
        ownerId: mapping.bigInt,
        type: mapping.string
    })
);
