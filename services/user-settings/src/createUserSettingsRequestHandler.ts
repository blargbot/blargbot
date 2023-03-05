import express, { asyncHandler } from '@blargbot/express';
import { mapping } from '@blargbot/mapping';
import type { UserSettings } from '@blargbot/user-settings-contract';
import userSettings from '@blargbot/user-settings-contract';

import type { UserSettingsService } from './UserSettingsService.js';

export function createUserSettingsRequestHandler(service: UserSettingsService): express.RequestHandler {
    const router = express.Router();
    router.route('/:userId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            res.status(200)
                .contentType('application/json')
                .end(userSettings.write(await service.getSettings(BigInt(req.params.userId))));
        }))
        .patch(asyncHandler(async (req, res) => {
            const mapped = mapUpdate(req.body);
            if (!mapped.valid) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            await service.updateSettings(BigInt(req.params.userId), mapped.value);
            res.status(204).end();
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.clearSettings(BigInt(req.params.userId));
            res.status(204).end();
        }));

    return router;
}

const mapUpdate = mapping.object<Partial<UserSettings>>({
    dontDmErrors: mapping.boolean.optional,
    prefixes: mapping.array(mapping.string).optional,
    timezone: mapping.string.nullish
});
