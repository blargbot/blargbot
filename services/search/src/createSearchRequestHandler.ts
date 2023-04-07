import express, { asyncHandler } from '@blargbot/express';

import type { SearchService } from './SearchService.js';

export function createSearchRequestHandler(service: SearchService): express.RequestHandler {
    const router = express.Router();

    router.route('/:scope')
        .get(asyncHandler(async (req, res) => {
            const types = toStringArray(req.query.types);
            const query = toStringArray(req.query.term);
            if (query.length === 0)
                return void res.status(200).send([]);
            const result = await service.search(req.params.scope, query[0], types);
            return void res.status(200).send(result.map(v => v.toString()));
        }));

    return router;
}

interface ParsedQs { [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[]; }

function toStringArray(value: ParsedQs[string]): string[] {
    switch (typeof value) {
        case 'string': return [value];
        case 'undefined': return [];
        case 'object': return Array.isArray(value)
            ? value.map(v => JSON.stringify(v))
            : [JSON.stringify(value)];
    }
}
