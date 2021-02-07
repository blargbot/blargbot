import { Cluster } from '../cluster';
import { StoredEvent } from '../core/RethinkDb';
import { ExpressionFunction } from 'rethinkdb';

export class EventManager {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cache: { [key: string]: StoredEvent };

    public constructor(
        public readonly cluster: Cluster
    ) {
        this.#cache = {};
    }

    public async insert(event: StoredEvent): Promise<void> {
        const res = await this.cluster.rethinkdb.query(r =>
            r.table('events').insert(event, { returnChanges: true })
        );

        const val = res.changes?.[0].new_val as StoredEvent;
        if (Date.now() - +val.endtime <= 1000 * 60 * 5) {
            this.#cache[val.id] = val;
        }
    }

    public async process(): Promise<void> {
        const events = Object.values(this.#cache)
            .filter(e => +e.endtime <= Date.now());

        for (const event of events) {
            if ((event.channel && !this.cluster.discord.getChannel(event.channel))
                || (event.guild && !this.cluster.discord.guilds.get(event.guild))
                || (event.guild && !this.cluster.discord.guilds.get(event.guild))
                || (!event.channel && !event.guild && event.user && this.cluster.id !== '0')
                || (event.type === 'purgelogs' && this.cluster.id !== '0')) {
                delete this.#cache[event.id];
                continue;
            }

            const type = event.type;
            void this.cluster.commands.get(type)?.event(event);
            await this.delete(event.id);
        }
    }

    public async delete(id: string): Promise<void> {
        delete this.#cache[id];
        await this.cluster.rethinkdb.query(r =>
            r.table('events').get(id).delete()
        );
    }

    public async deleteFilter(filter: ExpressionFunction<boolean>): Promise<void> {
        const res = await this.cluster.rethinkdb.query(r =>
            r.table('events').filter(filter).delete({ returnChanges: true })
        );

        if (res.changes) {
            for (const change of res.changes) {
                delete this.#cache[(<StoredEvent>change.old_val).id];
            }
        }
    }

    public async obtain(): Promise<void> {
        const events = this.cluster.rethinkdb.stream<StoredEvent>(r =>
            r.table('events')
                .between(
                    r.epochTime(0),
                    r.epochTime(Date.now() / 1000 + 60 * 5),
                    {
                        index: 'endtime'
                    }
                )
        );

        for await (const event of events) {
            this.#cache[event.id] = event;
        }
    }
}