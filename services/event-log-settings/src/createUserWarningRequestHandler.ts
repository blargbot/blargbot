import express, { asyncHandler } from '@blargbot/express';
import { mapping } from '@blargbot/mapping';

import type { GuildEventLog } from './GuildEventLogService.js';

export function createModLogRequestHandler(service: GuildEventLog): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getAllEventLogChannels(BigInt(req.params.guildId));
            res.status(200).send(Object.fromEntries(Object.entries(result).map(e => [e[0], e[1].toString()] as const)));
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.clearEventLogChannels(BigInt(req.params.guildId));
            res.status(201).end();
        }));

    router.route('/:guildId(\\d+)/:event')
        .get(asyncHandler(async (req, res) => {
            const channel = await service.getEventLogChannel(BigInt(req.params.guildId), req.params.event);
            if (channel === null) {
                res.status(404).end();
                return;
            }

            res.status(200).send({ channelId: channel.toString() });
        }))
        .patch(asyncHandler(async (req, res) => {
            const mapped = mapUpdate(req.body);
            if (!mapped.valid) {
                res.status(400).send({ error: 'Request body is invalid' });
                return;
            }

            await service.setEventLogChannel(BigInt(req.params.guildId), req.params.event, mapped.value.channelId);
            res.status(204).end();
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteEventLogChannel(BigInt(req.params.guildId), req.params.event);
            res.status(201).end();
        }));

    return router;
}

const mapUpdate = mapping.object({
    channelId: mapping.bigInt
});
