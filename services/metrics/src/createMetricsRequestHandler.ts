import express, { asyncHandler } from '@blargbot/express';

import type { MetricsService } from './MetricsService.js';

export function createMetricsRequestHandler(service: MetricsService): express.RequestHandler {
    const router = express.Router();

    router.route('/')
        .get(asyncHandler(async (_, res) => {
            const registry = await service.getRegistry();
            const metrics = await registry.metrics();
            res.status(200)
                .set('Content-Type', registry.contentType)
                .send(metrics);
        }));

    return router;
}
