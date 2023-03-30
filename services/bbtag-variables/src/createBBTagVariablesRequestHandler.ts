import { bbtagVariableSerializer, getBBTagVariablesResponseSerializer } from '@blargbot/bbtag-variables-client';
import express, { asyncHandler } from '@blargbot/express';

import type { BBTagVariablesService } from './BBTagVariablesService.js';

export function createBBTagVariablesRequestHandler(service: BBTagVariablesService): express.RequestHandler {
    const router = express.Router();
    router.route('/:ownerId(\\d+)')
        .delete(asyncHandler(async (req, res) => {
            await service.clearVariables(BigInt(req.params.ownerId));
            res.status(204).end();
        }));
    router.route('/:ownerId(\\d+)/:scope')
        .get(asyncHandler(async (req, res) => {
            let names = (req.query['name'] ?? []) as string | string[];
            if (!Array.isArray(names))
                names = [names];
            const result = await service.getAllVariables(BigInt(req.params.ownerId), req.params.scope, names);
            res.status(200)
                .contentType('application/json')
                .end(getBBTagVariablesResponseSerializer.write(result));
        }))
        .put(asyncHandler(async (req, res) => {
            if (typeof req.body !== 'object' || req.body === null)
                return void res.status(400).send({ message: 'Invalid body' });
            await service.setAllVariables(BigInt(req.params.ownerId), req.params.scope, req.body as Record<string, JToken>);
            return void res.status(204).end();
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.clearVariables(BigInt(req.params.ownerId), req.params.scope);
            res.status(204).end();
        }));
    router.route('/:ownerId(\\d+)/:scope/:name')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getVariable(BigInt(req.params.ownerId), req.params.scope, req.params.name);
            res.status(200)
                .contentType('application/json')
                .end(bbtagVariableSerializer.write(result));
        }))
        .put(asyncHandler(async (req, res) => {
            await service.setVariable(BigInt(req.params.ownerId), req.params.scope, req.params.name, (req.body as { value: JToken; }).value);
            res.status(204).end();
        }));

    return router;
}
