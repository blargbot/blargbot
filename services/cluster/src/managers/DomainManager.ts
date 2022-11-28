import { BotVariableStore } from '@blargbot/domain/stores';

export class DomainManager {
    #whitelist: Record<string, boolean>;
    readonly #db: BotVariableStore;

    public constructor(db: BotVariableStore) {
        this.#whitelist = {};
        this.#db = db;
    }

    public isWhitelisted(domain: string): boolean {
        return this.#whitelist[domain.toLowerCase()] === true;
    }

    public async toggle(...domains: string[]): Promise<{ added: string[]; removed: string[]; }> {
        await this.refresh();
        const added = [];
        const removed = [];

        for (const domain of domains) {
            const normDomain = domain.toLowerCase();
            this.#whitelist[normDomain] = !this.#whitelist[normDomain];

            if (!this.#whitelist[normDomain])
                removed.push(domain);
            else
                added.push(domain);
        }

        await this.#db.set('whitelistedDomains', { values: this.#whitelist });

        return { added, removed };
    }

    public async refresh(): Promise<void> {
        this.#whitelist = (await this.#db.get('whitelistedDomains'))?.values ?? {};
    }
}
