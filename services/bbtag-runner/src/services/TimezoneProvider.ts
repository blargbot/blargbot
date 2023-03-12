import type { BBTagContext, TimezoneProvider as BBTagTimezoneProvider } from '@bbtag/blargbot';
import type { UserSettingsHttpClient } from '@blargbot/user-settings-client';

export class TimezoneProvider implements BBTagTimezoneProvider {
    readonly #client: UserSettingsHttpClient;

    public constructor(client: UserSettingsHttpClient) {
        this.#client = client;
    }

    public async get(_context: BBTagContext, userId: string): Promise<string | undefined> {
        const settings = await this.#client.getSettings({ userId });
        return settings.timezone ?? undefined;
    }
}
