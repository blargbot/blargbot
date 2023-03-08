import express, { asyncHandler } from '@blargbot/express';
import type { MetricJson } from '@blargbot/metrics-client';

import type { MetricsService } from './MetricsService.js';

export function createMetricsRequestHandler(service: MetricsService): express.RequestHandler {
    const router = express.Router();

    router.route('/')
        .get(asyncHandler(async (_, res) => {
            const registry = service.aggregateMetrics();
            const metrics = await registry.metrics();
            res.status(200)
                .set('Content-Type', registry.contentType)
                .send(metrics);
        }));

    router.route('/:serviceId/:instanceId')
        .post((req, res): void => {
            if (!Array.isArray(req.body))
                return void res.status(400).end();

            const body = req.body as MetricJson[];
            service.setMetrics(req.params.serviceId, req.params.instanceId, body);
            res.status(204).end();
        });

    return router;
}
