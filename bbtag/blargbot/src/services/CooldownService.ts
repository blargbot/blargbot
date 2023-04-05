import moment from 'moment-timezone';

import type { BBTagScript } from '../BBTagScript.js';

export interface CooldownService {
    getCooldown(script: BBTagScript): Awaitable<Date>;
    setCooldown(script: BBTagScript): Awaitable<void>;
}

export class InProcessCooldownService implements CooldownService {
    readonly #cooldowns: Record<string, moment.Moment | undefined>;

    public constructor() {
        this.#cooldowns = {};
    }

    public getCooldown(script: BBTagScript): Date {
        const key = this.#getKey(script);
        const value = this.#cooldowns[key];
        if (value === undefined)
            return new Date(0);
        return value.clone()
            .add(script.cooldownMs)
            .toDate();
    }

    public setCooldown(script: BBTagScript): void {
        this.#cooldowns[this.#getKey(script)] = moment();
    }

    #getKey(script: BBTagScript): string {
        return `${script.runtime.guild.id}:${script.runtime.type}:${script.runtime.user.id}:${script.name}`;
    }
}

export interface IDistributedMap<Key, Value> {
    get(key: Key): Awaitable<Value | undefined>;
    set(key: Key, value: Value): Awaitable<void>;
}

export interface CooldownContext {
    readonly guildId: string;
    readonly userId: string;
    readonly script: {
        readonly type: string;
        readonly name: string;
    };
}

export class DistributedCooldownService implements CooldownService {
    readonly #cooldowns: IDistributedMap<CooldownContext, Date>;

    public constructor(cooldowns: IDistributedMap<CooldownContext, Date>) {
        this.#cooldowns = cooldowns;
    }

    public async getCooldown(script: BBTagScript): Promise<Date> {
        const key = this.#getKey(script);
        const value = await this.#cooldowns.get(key);
        if (value === undefined)
            return new Date(0);
        return new Date(value.valueOf() + script.cooldownMs);
    }

    public async setCooldown(script: BBTagScript): Promise<void> {
        await this.#cooldowns.set(this.#getKey(script), new Date());
    }

    #getKey(script: BBTagScript): CooldownContext {
        return {
            guildId: script.runtime.guild.id,
            userId: script.runtime.user.id,
            script: {
                name: script.runtime.entrypoint.name,
                type: script.runtime.type
            }
        };
    }
}
