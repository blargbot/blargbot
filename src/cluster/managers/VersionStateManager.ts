import { BotVariableStore } from '@blargbot/domain/stores';
import { mapping } from '@blargbot/mapping';
import { UpdateType, Version } from '@hunteroi/versioning';

const mapUpdateType = mapping.choice(
    mapping.in<UpdateType>('major', 'minor'),
    mapping.string.map<UpdateType>(() => 'patch')
);

export class VersionStateManager {
    public constructor(private readonly db: BotVariableStore) { }

    public async getVersion(): Promise<string> {
        const version = await this.getFromStorage();
        return version.toString();
    }

    public async updateVersion(type: string): Promise<void> {
        const version = await this.getFromStorage();

        const mapped = mapUpdateType(type);
        if (!mapped.valid) {
            throw new Error('Invalid update type');
        }

        version.update(mapped.value);

        await this.db.set('version', { major: version.major, minor: version.minor, patch: version.patch });
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
