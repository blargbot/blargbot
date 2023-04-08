import express, { asyncHandler } from '@blargbot/express';

import type { ChannelSearchService } from './ChannelSearchService.js';

export function createChannelSearchRequestHandler(service: ChannelSearchService): express.RequestHandler {
    const router = express.Router();

    router.route('/:ownerId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const query = toStringArray(req.query.term);
            if (query.length === 0)
                return void res.status(200).send([]);
            const result = await service.search(BigInt(req.params.ownerId), query[0]);
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
            ? value.flatMap(toStringArray)
            : [JSON.stringify(value)];
    }
}
