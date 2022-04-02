import { VarsTable } from '@blargbot/domain/stores';
import { mapping } from '@blargbot/mapping';
import { UpdateType, Version, VersionManager } from '@hunteroi/versioning';

const mapUpdateType = mapping.choice(
    mapping.in<UpdateType>('major', 'minor'),
    mapping.string.map<UpdateType>(() => 'patch')
);

export class VersionStateManager {
    public constructor(private readonly db: VarsTable) { }

    public async getVersion(): Promise<string> {
        const version = await this.getFromStorage();
        return version.toString();
    }

    public async updateVersion(type: string): Promise<void> {
        const version = await this.getFromStorage();
        const manager = new VersionManager(version);

        const mapped = mapUpdateType(type);
        if (!mapped.valid) {
            throw new Error('Invalid update type');
        }

        manager.update(mapped.value);

        await this.db.set('version', version);
    }

    private async getFromStorage(): Promise<Version> {
        const {
            major = 1,
            minor = 0,
            patch = 0
        } = await this.db.get('version') ?? {};
        return new Version(major, minor, patch);
    }
}
