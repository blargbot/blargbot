import { TagCooldownError } from './errors/TagCooldownError.js';

const never = Temporal.Instant.fromEpochMilliseconds(0);
export interface CooldownScope {
    readonly guildId: string;
    readonly userId: string;
    readonly tagName: string;
    readonly isCC: boolean;
    readonly cooldownMs: number;
}
export class TagCooldownManager {
    readonly #cooldowns = new Map<string, Temporal.Instant>();

    public check(scope: CooldownScope): Temporal.Duration | false {
        const key = `${scope.guildId}:${scope.isCC}:${scope.userId}:${scope.tagName}`;
        const start = this.#cooldowns.getOrInsert(key, never);
        const end = start.add({ milliseconds: scope.cooldownMs });
        const now = Temporal.Now.instant();
        const diff = now.until(end);
        if (diff.sign > 0)
            return diff;
        this.#cooldowns.set(key, now);
        return false;
    }

    public assert(scope: CooldownScope): void {
        const diff = this.check(scope);
        if (diff !== false)
            throw new TagCooldownError(scope.tagName, scope.isCC, diff);
    }
}
