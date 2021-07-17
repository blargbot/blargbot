import moment from 'moment';
import { Moment } from 'moment-timezone';

import { BBTagContext } from './BBTagContext';

export class TagCooldownManager {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cooldowns: Record<string, Moment | undefined>;

    public constructor() {
        this.#cooldowns = {};
    }

    public get(context: BBTagContext): Moment {
        return this.#cooldowns[this.getKey(context)] ??= moment();
    }
    public set(context: BBTagContext): Moment {
        return this.#cooldowns[this.getKey(context)] = moment().add(context.cooldown);
    }
    private getKey(context: BBTagContext): string {
        return `${context.guild.id}:${context.isCC}:${context.user.id}:${context.tagName}`;
    }
}
