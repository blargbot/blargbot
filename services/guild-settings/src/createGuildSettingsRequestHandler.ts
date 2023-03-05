import express, { asyncHandler } from '@blargbot/express';
import type { GuildSettings } from '@blargbot/guild-settings-contract';
import guildSettings from '@blargbot/guild-settings-contract';
import { mapping } from '@blargbot/mapping';

import type { GuildSettingsService } from './GuildSettingsService.js';

export function createGuildSettingsRequestHandler(service: GuildSettingsService): express.RequestHandler {
    const router = express.Router();

    router.route('/:guildId(\\d+)')
        .get(asyncHandler(async (req, res) => {
            res.status(200)
                .contentType('application/json')
                .end(guildSettings.write(await service.getSettings(BigInt(req.params.guildId))));
        }))
        .patch(asyncHandler(async (req, res) => {
            const mapped = mapUpdate(req.body);
            if (!mapped.valid) {
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

const mapUpdate = mapping.object<Partial<GuildSettings>>({
    actOnLimitsOnly: mapping.boolean.optional,
    adminRole: mapping.bigInt.nullish,
    banWarnCount: mapping.number.nullish,
    banOverridePerms: mapping.bigInt.nullish,
    cahNsfw: mapping.boolean.optional,
    disableEveryone: mapping.boolean.optional,
    disableNoPerms: mapping.boolean.optional,
    dmHelp: mapping.boolean.optional,
    enableSocialCommands: mapping.boolean.optional,
    farewellChannel: mapping.bigInt.nullish,
    greetChannel: mapping.bigInt.nullish,
    kickWarnCount: mapping.number.nullish,
    kickOverridePerms: mapping.bigInt.nullish,
    language: mapping.string.nullish,
    enableChatlogging: mapping.boolean.optional,
    maxAllowedMentions: mapping.number.nullish,
    modLogChannel: mapping.bigInt.nullish,
    mutedRole: mapping.bigInt.nullish,
    noCleverBot: mapping.boolean.optional,
    notifyCommandMessageDelete: mapping.boolean.optional,
    prefixes: mapping.array(mapping.string).optional,
    staffPerms: mapping.bigInt.optional,
    tableFlip: mapping.boolean.optional,
    timeoutWarnCount: mapping.number.nullish,
    timeoutOverridePerms: mapping.bigInt.nullish,
    announceChannel: mapping.bigInt.nullish,
    announceRole: mapping.bigInt.nullish
});
