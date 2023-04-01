import type { DumpService as BBTagDumpService, Entities } from '@bbtag/blargbot';
import type { MessageDumpsHttpClient } from '@blargbot/message-dumps-client';
import type { SnowflakeFactory } from '@blargbot/snowflakes';

import type { MessageDumpUrlFactory } from './MessageDumpUrlFactory.js';

export class DumpService implements BBTagDumpService {
    readonly #client: MessageDumpsHttpClient;
    readonly #snowflake: SnowflakeFactory;
    readonly #dumpUrlFactory: MessageDumpUrlFactory;

    public constructor(client: MessageDumpsHttpClient, snowflake: SnowflakeFactory, dumpUrlFactory: MessageDumpUrlFactory) {
        this.#client = client;
        this.#snowflake = snowflake;
        this.#dumpUrlFactory = dumpUrlFactory;
    }

    public async generateDumpPage(payload: Entities.MessageCreateOptions, channel: Entities.Channel): Promise<URL> {
        const id = this.#snowflake.createRaw();
        await this.#client.createMessageDump({
            channelId: BigInt(channel.id),
            expiry: new Date(Date.now() + 604800),
            id,
            content: payload.content,
            embeds: payload.embeds
        });
        return this.#dumpUrlFactory.getUrl(id);
    }
}
