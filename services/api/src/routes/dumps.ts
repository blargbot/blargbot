import type { Api } from '@blargbot/api/Api.js';
import { guard } from '@blargbot/core/utils/index.js';
import type { Dump } from '@blargbot/domain/models/Dump.js';
import type { DiscordTagSet } from '@blargbot/domain/models/index.js';
import type Discord from 'discord-api-types/v9';

import { BaseRoute } from '../BaseRoute.js';
import type { ApiResponse } from '../types.js';

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

        let tags = noTags;
        const channel = await this.#api.util.getChannel(dump.channelid.toString());
        if (channel !== undefined && guard.isGuildChannel(channel)) {
            tags = await this.#api.util.discoverMessageEntities({
                guildId: channel.guild.id,
                content: dump.content,
                embeds: dump.embeds as Discord.APIEmbed[]
            });
        }

        return this.ok<ExpandedDump>({
            ...dump,
            ...tags
        });
    }
}

interface ExpandedDump extends Dump, DiscordTagSet {
}

const noTags: DiscordTagSet = {
    parsedChannels: {},
    parsedRoles: {},
    parsedUsers: {}
};
