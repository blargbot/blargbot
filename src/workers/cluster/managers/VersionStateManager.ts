import { mapping } from '@cluster/utils';
import { VarsTable } from '@core/types';
import { UpdateType, Version, VersionManager } from '@hunteroi/versioning';

const mapUpdateType = mapping.choice(
    mapping.in<UpdateType>('major', 'minor'),
    mapping.string.map<UpdateType>(() => 'patch')
);

export class VersionStateManager {
    #version: Version;

    public constructor(private readonly db: VarsTable) {
        this.#version = new Version();
    }

    public async getVersion(): Promise<string> {
        await this.refresh();
        return this.#version.toString();
    }

    public async updateVersion(type: string): Promise<void> {
        await this.refresh();
        const manager = new VersionManager(this.#version);

        const mapped = mapUpdateType(type);
        if (!mapped.valid) {
            throw new Error('Invalid update type');
        }

        manager.update(mapped.value);

        await this.db.set('version', this.#version);
    }

    private async refresh(): Promise<void> {
        const {
            major = 1,
            minor = 0,
            patch = 0
        } = await this.db.get('version') ?? {};
        this.#version = new Version(major, minor, patch);
    }
}
