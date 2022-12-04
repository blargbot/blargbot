import { Api } from '@blargbot/api/Api.js';
import { guard } from '@blargbot/core/utils/index.js';
import { Dump } from '@blargbot/domain/models/Dump.js';
import { DiscordTagSet } from '@blargbot/domain/models/index.js';
import Discord from 'discord-api-types/v9';

import { BaseRoute } from '../BaseRoute.js';
import { ApiResponse } from '../types.js';

export class DumpsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/dumps');

        this.#api = api;

        this.addRoute('/:id', {
            get: ({ request }) => this.getDump(request.params.id)
        });
    }

    public async getDump(id: string): Promise<ApiResponse> {
        const dump = await this.#api.database.dumps.get(id);
        if (dump === undefined)
            return this.notFound();

        const result: ExpandedDump = {
            ...dump,
            parsedChannels: {},
            parsedRoles: {},
            parsedUsers: {}
        };

        const channel = await this.#api.util.getChannel(dump.channelid.toString());
        if (channel !== undefined && guard.isGuildChannel(channel)) {
            if (dump.content !== undefined)
                await this.#api.util.loadDiscordTagData(dump.content, channel.guild.id, result);
            for (const embed of (dump.embeds ?? []) as Discord.APIEmbed[]) {
                if (embed.title !== undefined)
                    await this.#api.util.loadDiscordTagData(embed.title, channel.guild.id, result);
                if (embed.description !== undefined)
                    await this.#api.util.loadDiscordTagData(embed.description, channel.guild.id, result);
                for (const field of embed.fields ?? []) {
                    await this.#api.util.loadDiscordTagData(field.name, channel.guild.id, result);
                    await this.#api.util.loadDiscordTagData(field.value, channel.guild.id, result);
                }
            }
        }

        return this.ok(result);
    }
}

interface ExpandedDump extends Dump, DiscordTagSet {
}
