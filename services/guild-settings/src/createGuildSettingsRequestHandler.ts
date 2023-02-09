import { mapping } from '@blargbot/mapping';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { GuildSettings } from './GuildSettings.js';
import { guildSerializer } from './GuildSettings.js';
import type { GuildSettingsService } from './GuildSettingsService.js';

export function createGuildSettingsRequestHandler(service: GuildSettingsService): RequestHandler<{ guildId: string; }> {
    return function handleRequest(request, response, next) {
        void handleRequestAsync(request, response, next)
            .catch(err => {
                response.status(500).send({
                    message: 'Internal server error'
                });
                console.error(request.url, err);
            });
    };

    async function handleRequestAsync(request: Request<{ guildId: string; }>, response: Response, next: NextFunction): Promise<void> {
        const mappedGuildId = mapping.bigInt(request.params.guildId);
        if (!mappedGuildId.valid)
            return next();

        const guildId = mappedGuildId.value;
        switch (request.method) {
            case 'GET':
                return void response
                    .status(200)
                    .contentType('application/json')
                    .end(guildSerializer.write(await service.getSettings(guildId)));
            case 'DELETE':
                await service.clearSettings(guildId);
                return void response.status(201).end();
            case 'PATCH': {
                const mapped = mapUpdate(request.body);
                if (!mapped.valid)
                    return void response.status(400).send({
                        error: 'Request body is invalid'
                    });

                await service.updateSettings(guildId, mapped.value);
                return void response.status(201).end();
            }
            default: return next();
        }
    }
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
    timeoutOverridePerms: mapping.bigInt.nullish
});
