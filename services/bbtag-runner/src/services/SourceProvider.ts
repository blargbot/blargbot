import type { BBTagRuntime, SourceProvider as BBTagSourceProvider } from '@bbtag/blargbot';
import type { BBTagSourceHttpClient } from '@blargbot/bbtag-source-client';

export class SourceProvider implements BBTagSourceProvider {
    readonly #client: BBTagSourceHttpClient;

    public constructor(client: BBTagSourceHttpClient) {
        this.#client = client;
    }

    public async get(context: BBTagRuntime, type: string, name: string): Promise<{ content: string; cooldown: number; } | undefined> {
        const result = await this.#client.get({ ownerId: BigInt(context.guild.id), type, name });
        if (result === undefined)
            return undefined;

        return { content: result.value, cooldown: result.cooldown };
    }
}
