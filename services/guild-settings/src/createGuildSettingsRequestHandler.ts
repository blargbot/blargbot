import express, { asyncHandler } from '@blargbot/express';
import { guildSettingsSerializer, guildSettingsUpdateSerializer } from '@blargbot/guild-settings-client';

import type { GuildSettingsService } from './GuildSettingsService.js';

export function createGuildSettingsRequestHandler(service: GuildSettingsService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            res.status(200)
                .contentType('application/json')
                .end(await guildSettingsSerializer.write(await service.getSettings(BigInt(req.params.guildId))));
        }))
        .patch(asyncHandler(async (req, res) => {
            const mapped = await guildSettingsUpdateSerializer.fromJson(req.body as JToken);
            if (!mapped.success) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            await service.updateSettings(BigInt(req.params.guildId), mapped.value);
            res.status(204).end();
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.clearSettings(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    return router;
}
