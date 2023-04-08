import type Discord from '@blargbot/discord-types';
import { isGuildChannel } from '@blargbot/discord-util';
import type { SearchClient } from '@blargbot/search-client';

const tChannelName = 'channel:name';
const tChannelId = 'channel:id';
export class ChannelSearchService {
    readonly #search: SearchClient;

    public constructor(search: SearchClient) {
        this.#search = search;
    }

    public async search(ownerID: bigint, query: string): Promise<bigint[]> {
        const channelIds = await this.#search.search({ scope: ownerID.toString(), query, types: [tChannelName, tChannelId] });
        return channelIds.map(BigInt);
    }

    public async setChannel(channel: Discord.APIChannel): Promise<void> {
        await Promise.all(this.#setChannelIter(channel));
    }

    * #setChannelIter(channel: Discord.APIChannel): Iterable<Awaitable<unknown>> {
        const scope = this.#getOwnerId(channel);
        const value = channel.id;
        if (typeof channel.name === 'string')
            yield this.#search.setSearchTerm({ scope, type: tChannelName, key: channel.name, value });
        yield this.#search.setSearchTerm({ scope, type: tChannelId, key: value, value });
    }

    public async deleteChannel(channel: Discord.APIChannel): Promise<void> {
        await Promise.all(this.#deleteChannelIter(channel));
    }

    * #deleteChannelIter(channel: Discord.APIChannel): Iterable<Awaitable<unknown>> {
        const scope = this.#getOwnerId(channel);
        const value = channel.id;
        if (typeof channel.name === 'string')
            yield this.#search.deleteSearchTerm({ scope, type: tChannelName, value });
        yield this.#search.deleteSearchTerm({ scope, type: tChannelId, value });
    }

    #getOwnerId(channel: Discord.APIChannel): string {
        return isGuildChannel(channel) ? channel.guild_id ?? channel.id : channel.id;
    }
}
