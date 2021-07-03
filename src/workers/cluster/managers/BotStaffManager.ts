import { Guild } from 'eris';
import { Cluster } from '../Cluster';

export class BotStaffManager {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #staff: Set<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #support: Set<string>;

    public get staff(): ReadonlySet<string> { return this.#staff; }
    public get support(): ReadonlySet<string> { return this.#support; }

    public constructor(private readonly cluster: Cluster) {
        this.#staff = new Set();
        this.#support = new Set();
    }

    public async refresh(): Promise<void> {
        const { staff, support } = await this.getUsers();

        this.#staff.clear();
        for (const userId of staff)
            this.#staff.add(userId);

        this.#support.clear();
        for (const userId of support)
            this.#support.add(userId);
    }

    private async getUsers(): Promise<{ staff: readonly string[]; support: readonly string[]; }> {
        const guild = this.cluster.discord.guilds.get(this.cluster.config.discord.guilds.home);
        if (guild === undefined) { // The guild is on another cluster
            const staff = await this.cluster.database.vars.get('police');
            const support = await this.cluster.database.vars.get('support');

            return { staff: staff?.value ?? [], support: support?.value ?? [] };
        }

        const staff = userIdsWithRole(guild, this.cluster.config.discord.roles.staff);
        const support = userIdsWithRole(guild, this.cluster.config.discord.roles.support);

        await Promise.all([
            this.cluster.database.vars.set({ varname: 'police', value: staff }),
            this.cluster.database.vars.set({ varname: 'support', value: support })
        ]);

        return { staff, support };
    }
}

function userIdsWithRole(guild: Guild, roleId: string): string[] {
    return guild.members.filter(m => m.roles.includes(roleId)).map(m => m.id);
}