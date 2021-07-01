import { IntervalService } from '../../structures/IntervalService';
import { Cluster } from '../Cluster';


export class BotStaffWhitelist extends IntervalService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #police: Set<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #support: Set<string>;

    public readonly type: string = 'bot';
    public get police(): ReadonlySet<string> { return this.#police; }
    public get support(): ReadonlySet<string> { return this.#support; }

    public constructor(private readonly cluster: Cluster) {
        super(1, 'day', cluster.logger);
        this.#police = new Set();
        this.#support = new Set();
    }

    public async refresh(): Promise<void> {
        const guild = this.cluster.discord.guilds.get(this.cluster.config.discord.guilds.home);
        if (guild !== undefined) {
            await this.cluster.database.vars.set({
                varname: 'police',
                value: guild.members
                    .filter(m => m.roles.includes(this.cluster.config.discord.roles.police))
                    .map(m => m.id)
            });
            await this.cluster.database.vars.set({
                varname: 'support',
                value: guild.members
                    .filter(m => m.roles.includes(this.cluster.config.discord.roles.support))
                    .map(m => m.id)
            });
        }
    }

    protected async execute(): Promise<void> {
        await this.refresh();

        const police = await this.cluster.database.vars.get('police');
        this.#police = new Set(police?.value);
        const support = await this.cluster.database.vars.get('support');
        this.#support = new Set(support?.value);
    }
}
