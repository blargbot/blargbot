import { Cluster } from '@blargbot/cluster';
import { Guild } from 'eris';

export class BotStaffManager {
    readonly #staff: Set<string>;
    readonly #support: Set<string>;
    readonly #cluster: Cluster;

    public get staff(): ReadonlySet<string> { return this.#staff; }
    public get support(): ReadonlySet<string> { return this.#support; }

    public constructor(cluster: Cluster) {
        this.#staff = new Set();
        this.#support = new Set();
        this.#cluster = cluster;
    }

    public async refresh(): Promise<void> {
        const { staff, support } = await this.#getUsers();

        this.#staff.clear();
        for (const userId of staff)
            this.#staff.add(userId);

        this.#support.clear();
        for (const userId of support)
            this.#support.add(userId);
    }

    async #getUsers(): Promise<{ staff: readonly string[]; support: readonly string[]; }> {
        const guild = this.#cluster.discord.guilds.get(this.#cluster.config.discord.guilds.home);
        if (guild === undefined) { // The guild is on another cluster
            const staff = await this.#cluster.database.vars.get(`police`);
            const support = await this.#cluster.database.vars.get(`support`);

            return { staff: staff?.value ?? [], support: support?.value ?? [] };
        }

        const staff = await this.#userIdsWithRole(guild, this.#cluster.config.discord.roles.staff);
        const support = await this.#userIdsWithRole(guild, this.#cluster.config.discord.roles.support);

        await Promise.all([
            this.#cluster.database.vars.set(`police`, { value: staff }),
            this.#cluster.database.vars.set(`support`, { value: support })
        ]);

        return { staff, support };
    }
    async #userIdsWithRole(guild: Guild, roleId: string): Promise<string[]> {
        await this.#cluster.util.ensureMemberCache(guild);
        return guild.members.filter(m => m.roles.includes(roleId)).map(m => m.id);
    }
}
