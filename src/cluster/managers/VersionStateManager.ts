import type { BotVariableStore } from '@blargbot/domain';
import { Version } from '@hunteroi/versioning';
import z from 'zod';

const mapUpdateType = z.enum(['major', 'minor', 'patch']).catch('patch');

export class VersionStateManager {
    readonly #db: BotVariableStore;

    public constructor(db: BotVariableStore) {
        this.#db = db;
    }

    public async getVersion(): Promise<string> {
        const version = await this.#getFromStorage();
        return version.toString();
    }

    public async updateVersion(type: string): Promise<void> {
        const version = await this.#getFromStorage();

        const mapped = mapUpdateType.safeParse(type);
        if (!mapped.success) {
            throw new Error('Invalid update type');
        }

        version.update(mapped.data);

        await this.#db.set('version', version);
    }

    async #getFromStorage(): Promise<Version> {
        const {
            major = 1,
            minor = 0,
            patch = 0
        } = await this.#db.get('version') ?? {};
        return new Version(major, minor, patch);
    }
}
