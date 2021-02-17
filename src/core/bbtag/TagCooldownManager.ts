import { Moment } from 'moment-timezone';
import moment from 'moment';
import { RuntimeContext } from './RuntimeContext';


export class TagCooldownManager {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cooldowns: Record<string, Moment | undefined>;

    public constructor() {
        this.#cooldowns = {};
    }

    public get(context: RuntimeContext): Moment {
        return this.#cooldowns[this.getKey(context)] ??= moment();
    }
    public set(context: RuntimeContext): Moment {
        return this.#cooldowns[this.getKey(context)] = moment().add(context.cooldown);
    }
    private getKey(context: RuntimeContext): string {
        return `${context.guild.id}:${context.isCC}:${context.user.id}:${context.tagName}`;
    }
}
