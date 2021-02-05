import { Cluster } from "../cluster";
import { Event } from "../core/RethinkDb";
import { ExpressionFunction } from 'rethinkdb';

export class EventManager {
    #cache: { [key: string]: Event };
    constructor(
        public readonly cluster: Cluster
    ) {
        this.#cache = {};
    }

    async insert(event: Event) {
        const res = await this.cluster.rethinkdb.query(r =>
            r.table('events').insert(event, { returnChanges: true })
        );

        const val = (<any>res).changes[0].new_val;
        if (Date.now() - +val.endtime <= 1000 * 60 * 5) {
            this.#cache[val.id] = val;
        }
    }

    async process() {
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

            let type = event.type;
            this.cluster.commands.get(type)?.event(event);
            await this.delete(event.id);
        }
    }

    async delete(id: string) {
        delete this.#cache[id];
        await this.cluster.rethinkdb.query(r =>
            r.table('events').get(id).delete()
        );
    }

    async deleteFilter(filter: ExpressionFunction<boolean>) {
        const res = await this.cluster.rethinkdb.query(r =>
            r.table('events').filter(filter).delete({ returnChanges: true })
        );

        for (const change of (<any>res).changes) {
            delete this.#cache[change.old_val.id];
        }
    }

    async obtain() {
        let events = this.cluster.rethinkdb.queryAll<Event>(r =>
            r.table('events')
                .between(
                    this.cluster.rethinkdb.epochTime(0),
                    this.cluster.rethinkdb.epochTime(Date.now() / 1000 + 60 * 5),
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