import { User } from "eris";

export class BanStore {
    #guilds: Map<string, GuildBanStore>;
    constructor() {
        this.#guilds = new Map();
    }

    get(guildId: string): GuildBanStore;
    get(guildId: string, userId: string): BanDetails | undefined;
    get(guildId: string, userId?: string): BanDetails | undefined | GuildBanStore {
        let guild = this.#guilds.get(guildId);
        if (userId)
            return guild?.get(userId);

        if (!guild)
            this.#guilds.set(guildId, guild = new GuildBanStore(guildId));

        return guild;
    }

    set(guildId: string, details: MassBanDetails): void
    set(guildId: string, userId: string, details: BanDetails): void
    set(guildId: string, ...args: [userId: string, details: BanDetails] | [details: MassBanDetails]) {
        if (args.length === 2)
            this.get(guildId).set(...args);
        else
            this.get(guildId).mass = args[0];
    }

    clear(guildId: string): void
    clear(guildId: string, userId: string): void
    clear(guildId: string, userId?: string) {
        if (userId)
            this.#guilds.get(guildId)?.delete(userId);
        else
            this.#guilds.delete(guildId);
    }
}

class GuildBanStore {
    readonly #users: Map<string, BanDetails>;
    readonly guildId: string;
    mass: MassBanDetails | undefined;

    constructor(guildId: string) {
        this.#users = new Map();
        this.guildId = guildId;
    }

    get(userId: string) {
        return this.#users.get(userId);
    }

    set(userId: string, details: BanDetails) {
        this.#users.set(userId, details);
    }

    delete(userId: string) {
        this.#users.delete(userId);
    }
}

export interface BanDetails {
    mod: User;
    type: string;
    reason: string;
}

export interface MassBanDetails {
    mod: User;
    type: string;
    users: User[];
    newUsers: User[];
    reason: string;
}