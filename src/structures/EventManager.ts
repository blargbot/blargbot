import { Cluster } from '../cluster';
import moment from 'moment';
import { guard } from '../utils';
import { EventType, StoredEvent, StoredEventOptions } from '../core/database';
import { BaseCommand, BaseEventCommand } from '../core/command';

export class EventManager {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #events: Map<string, StoredEvent>;

    public constructor(
        public readonly cluster: Cluster
    ) {
        this.#events = new Map();
    }

    public async insert<K extends EventType>(type: K, event: StoredEventOptions<K>): Promise<void> {
        const storedEvent = await this.cluster.database.events.add(type, event);
        if (storedEvent === undefined)
            return;

        if (moment().add(5, 'minutes').diff(event.endtime) < 0)
            this.#events.set(storedEvent.id, storedEvent);
    }

    public async process(): Promise<void> {
        for (const event of this.#events.values()) {
            if (moment().diff(event.endtime) > 0)
                continue;

            const shardId = this.getShardId(event);
            if (this.cluster.discord.shards.has(shardId)) {
                this.#events.delete(event.id);
                continue;
            }

            const type = event.type;
            const command = this.cluster.commands.get(type);
            if (canHandleEvents(type, command))
                void command.handleEvent(event);
            await this.delete(event.id);
        }
    }

    private getShardId(event: StoredEventOptions): number {
        if (event.channel !== undefined) {
            const channel = this.cluster.discord.getChannel(event.channel);
            if (guard.isGuildChannel(channel))
                return channel.guild.shard.id;
        }
        if (event.guild !== undefined) {
            const guild = this.cluster.discord.guilds.get(event.guild);
            if (guild)
                return guild.shard.id;
        }
        return 0;
    }

    public async delete(event: string): Promise<void> {
        this.#events.delete(event);
        await this.cluster.database.events.delete(event);
    }

    public async deleteFilter(source: string): Promise<void> {
        await this.cluster.database.events.delete({ source });
        for (const event of this.#events.values())
            if (event.source === source)
                this.#events.delete(event.id);
    }

    public async obtain(): Promise<void> {
        const events = await this.cluster.database.events.between(0, moment().add(5, 'minutes'));
        this.#events = new Map(events.map(e => [e.id, e]));
    }
}

// eslint-disable-next-line @typescript-eslint/ban-types
function canHandleEvents<K extends EventType>(type: K, command: BaseCommand | undefined): command is BaseEventCommand<K> {
    return command !== undefined && command instanceof BaseEventCommand && command.name === type;
}