import { BanDetails, MassBanDetails } from './types';

export class BanStore {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #guilds: Map<string, GuildBanStore>;

    public constructor() {
        this.#guilds = new Map();
    }

    public get(guildId: string): GuildBanStore;
    public get(guildId: string, userId: string): BanDetails | undefined;
    public get(guildId: string, userId?: string): BanDetails | undefined | GuildBanStore {
        let guild = this.#guilds.get(guildId);
        if (userId !== undefined)
            return guild?.get(userId);

        if (!guild)
            this.#guilds.set(guildId, guild = new GuildBanStore(guildId));

        return guild;
    }

    public set(guildId: string, details: MassBanDetails): void
    public set(guildId: string, userId: string, details: BanDetails): void
    public set(guildId: string, ...args: [userId: string, details: BanDetails] | [details: MassBanDetails]): void {
        if (args.length === 2)
            this.get(guildId).set(...args);
        else
            this.get(guildId).mass = args[0];
    }

    public clear(guildId: string): void
    public clear(guildId: string, userId: string): void
    public clear(guildId: string, userId?: string): void {
        if (userId !== undefined)
            this.#guilds.get(guildId)?.delete(userId);
        else
            this.#guilds.delete(guildId);
    }
}

class GuildBanStore {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #users: Map<string, BanDetails>;
    public readonly guildId: string;
    public mass: MassBanDetails | undefined;

    public constructor(guildId: string) {
        this.#users = new Map();
        this.guildId = guildId;
    }

    public get(userId: string): BanDetails | undefined {
        return this.#users.get(userId);
    }

    public set(userId: string, details: BanDetails): void {
        this.#users.set(userId, details);
    }

    public delete(userId: string): void {
        this.#users.delete(userId);
    }
}