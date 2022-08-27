import moment, { Moment } from 'moment-timezone';

import { BBTagContext } from './BBTagContext';

export class TagCooldownManager {
    readonly #cooldowns: Record<string, Moment | undefined>;

    public constructor() {
        this.#cooldowns = {};
    }

    public get(context: BBTagContext): Moment {
        const key = this.#getKey(context);
        const value = this.#cooldowns[key];
        if (value !== undefined)
            return value.clone().add(context.cooldown);
        return this.#cooldowns[key] = moment();
    }

    public set(context: BBTagContext): Moment {
        return this.#cooldowns[this.#getKey(context)] = moment();
    }

    #getKey(context: BBTagContext): string {
        return `${context.guild.id}:${context.isCC}:${context.user.id}:${context.tagName}`;
    }
}
