import type { DomainWhitelistData } from '@blargbot/domain-whitelist-client';
import express, { asyncHandler } from '@blargbot/express';
import { mapping } from '@blargbot/mapping';

import type { DomainWhitelistService } from './DomainWhitelistService.js';

export function createDomainWhitelistRequestHandler(service: DomainWhitelistService): express.RequestHandler {
    const router = express.Router();
    router.route('/:domain')
        .get(asyncHandler(async (req, res) => {
            const whitelisted = await service.check(req.params.domain);
            res.status(200).send({ whitelisted } satisfies DomainWhitelistData);
        }))
        .patch(asyncHandler(async (req, res) => {
            const update = mapUpdate(req.body);
            if (!update.valid)
                return void res.status(400).json({ error: 'Invalid request body' });

            await service.set(req.params.domain, update.value.whitelisted);
            return void res.status(204).end();
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.set(req.params.domain, false);
            return void res.status(204).end();
        }));

    return router;
}

const mapUpdate = mapping.object<DomainWhitelistData>({
    whitelisted: mapping.boolean
});
