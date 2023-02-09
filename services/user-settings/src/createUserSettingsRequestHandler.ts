import { mapping } from '@blargbot/mapping';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { UserSettings } from './UserSettings.js';
import { userSerializer } from './UserSettings.js';
import type { UserSettingsService } from './UserSettingsService.js';

export function createUserSettingsRequestHandler(service: UserSettingsService): RequestHandler<{ userId: string; }> {
    return function handleRequest(request, response, next) {
        void handleRequestAsync(request, response, next)
            .catch(err => {
                response.status(500).send({
                    message: 'Internal server error'
                });
                console.error(request.url, err);
            });
    };

    async function handleRequestAsync(request: Request<{ userId: string; }>, response: Response, next: NextFunction): Promise<void> {
        const mappedUserId = mapping.bigInt(request.params.userId);
        if (!mappedUserId.valid)
            return next();

        const userId = mappedUserId.value;
        switch (request.method) {
            case 'GET':
                return void response
                    .status(200)
                    .contentType('application/json')
                    .end(userSerializer.write(await service.getSettings(userId)));
            case 'DELETE':
                await service.clearSettings(userId);
                return void response.status(201).end();
            case 'PATCH': {
                const mapped = mapUpdate(request.body);
                if (!mapped.valid)
                    return void response.status(400).send({
                        error: 'Request body is invalid'
                    });

                await service.updateSettings(userId, mapped.value);
                return void response.status(201).end();
            }
            default: return next();
        }
    }
}

const mapUpdate = mapping.object<Partial<UserSettings>>({
    dontDmErrors: mapping.boolean.optional,
    prefixes: mapping.array(mapping.string).optional,
    timezone: mapping.string.nullish
});
