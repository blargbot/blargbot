import moment from 'moment-timezone';

import type { BBTagContext } from '../index.js';

export interface CooldownService {
    getCooldown(context: BBTagContext, type: 'tag' | 'cc', name: string, durationMs: number): Awaitable<Date>;
    setCooldown(context: BBTagContext, type: 'tag' | 'cc', name: string): Awaitable<void>;
}

export class InProcessCooldownService implements CooldownService {
    readonly #cooldowns: Record<string, moment.Moment | undefined>;

    public constructor() {
        this.#cooldowns = {};
    }

    public getCooldown(context: BBTagContext, type: 'cc' | 'tag', name: string, durationMs: number): Date {
        const key = this.#getKey(context, type, name);
        const value = this.#cooldowns[key];
        if (value === undefined)
            return new Date(0);
        return value.clone()
            .add(durationMs)
            .toDate();
    }

    public setCooldown(context: BBTagContext, type: 'cc' | 'tag', name: string): void {
        this.#cooldowns[this.#getKey(context, type, name)] = moment();
    }

    #getKey(context: BBTagContext, type: 'cc' | 'tag', name: string): string {
        return `${context.guild.id}:${type}:${context.user.id}:${name}`;
    }
}

export interface IDistributedMap<Key, Value> {
    get(key: Key): Awaitable<Value | undefined>;
    set(key: Key, value: Value): Awaitable<void>;
}

export class DistributedCooldownService implements CooldownService {
    readonly #cooldowns: IDistributedMap<string, Date>;

    public constructor(cooldowns: IDistributedMap<string, Date>) {
        this.#cooldowns = cooldowns;
    }

    public async getCooldown(context: BBTagContext, type: 'cc' | 'tag', name: string, durationMs: number): Promise<Date> {
        const key = this.#getKey(context, type, name);
        const value = await this.#cooldowns.get(key);
        if (value === undefined)
            return new Date(0);
        return new Date(value.valueOf() + durationMs);
    }

    public async setCooldown(context: BBTagContext, type: 'cc' | 'tag', name: string): Promise<void> {
        await this.#cooldowns.set(this.#getKey(context, type, name), new Date());
    }

    #getKey(context: BBTagContext, type: 'cc' | 'tag', name: string): string {
        return `${context.guild.id}:${type}:${context.user.id}:${name}`;
    }
}
