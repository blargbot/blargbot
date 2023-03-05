import express, { asyncHandler } from '@blargbot/express';

import type { DiscordChannelCacheService } from './DiscordChannelCacheService.js';

export function createMemberCacheRequestHandler(service: DiscordChannelCacheService): express.RequestHandler {
    const router = express.Router();

    router.route('/:channelId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getChannel(BigInt(req.params.channelId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result);
        }));
    router.route('/:channelId(\\d+)/guild-id')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getChannelGuild(BigInt(req.params.channelId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send({ guildId: result.toString() });
        }));

    router.route('/guilds/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getGuildChannels(BigInt(req.params.guildId));
            res.status(200).send(result);
        }))
        .delete(asyncHandler(async (req, res) => {
            await service.deleteGuild(BigInt(req.params.guildId));
            res.status(204).end();
        }));

    router.route('/guilds/:guildId(\\d+)/:channelId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            const result = await service.getGuildChannel(BigInt(req.params.guildId), BigInt(req.params.channelId));
            if (result === undefined)
                res.status(404).end();
            else
                res.status(200).send(result);
        }));

    return router;
}
