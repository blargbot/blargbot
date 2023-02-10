import type { IModLogEntryDatabase } from './IModLogEntryDatabase.js';
import type { ModLogEntry } from './ModLogEntry.js';

export class ModLogService {
    readonly #database: IModLogEntryDatabase;

    public constructor(database: IModLogEntryDatabase) {
        this.#database = database;
    }

    public async getModLog(guildId: bigint, caseId: number): Promise<ModLogEntry | undefined> {
        return await this.#database.get(guildId, caseId);
    }

    public async getAllModLogs(guildId: bigint): Promise<ModLogEntry[]> {
        return await this.#database.list(guildId);
    }

    public async createModLog(guildId: bigint, modLog: Omit<ModLogEntry, 'caseId'>): Promise<number> {
        return await this.#database.create(guildId, modLog);
    }

    public async updateModLog(guildId: bigint, caseId: number, modLog: Partial<Omit<ModLogEntry, 'caseId'>>): Promise<void> {
        await this.#database.update(guildId, caseId, modLog);
    }

    public async deleteModLog(guildId: bigint, caseId: number): Promise<void> {
        await this.#database.delete(guildId, caseId);
    }
}
