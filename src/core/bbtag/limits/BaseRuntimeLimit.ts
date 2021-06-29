import { limits } from '..';
import { BBTagContext } from '../BBTagContext';
import { SubtagCall, RuntimeLimit, SerializedRuntimeLimit } from '../types';
import { RuntimeLimitRule } from './rules/RuntimeLimitRule';

interface RuntimeLimitRuleCollection {
    [key: string]: RuntimeLimitRule[];
}

export abstract class BaseRuntimeLimit implements RuntimeLimit {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #rules: Record<string, RuntimeLimitRuleCollection | undefined>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #name: keyof typeof limits;

    abstract get scopeName(): string;

    protected constructor(name: keyof typeof limits) {
        this.#rules = {};
        this.#name = name;
    }

    private getKeys(key: string, useDefault?: true): [rootKey: string, subKey: string]
    private getKeys(key: string, useDefault: false): [rootKey: string, subKey?: string]
    private getKeys(key: string, useDefault = true): [rootKey: string, subKey?: string] {
        const keySplit = key.split(':', 2);
        return [keySplit[0], keySplit[1] ?? (useDefault ? 'default' : undefined)];
    }

    public addRules(rulekey: string | string[], ...rules: RuntimeLimitRule[]): this {
        rulekey = Array.isArray(rulekey) ? rulekey : [rulekey];
        for (const name of new Set(rulekey)) {
            const [rootKey, subKey] = this.getKeys(name);
            const set = this.#rules[rootKey] ??= {};
            const collection = set[subKey] ??= [];
            collection.push(...rules);
        }
        return this;
    }

    public async check(context: BBTagContext, subtag: SubtagCall, rulekey: string): Promise<string | null> {
        const [rootKey, subKey] = this.getKeys(rulekey);
        const set = this.#rules[rootKey] ?? {};
        const collection = set[subKey];
        if (collection === undefined)
            return null;

        for (const rule of collection) {
            if (!await rule.check(context, subtag)) {
                return context.addError(rule.errorText(rulekey, this.scopeName), subtag);
            }
        }
        return null;
    }

    public rulesFor(rulekey: string): string[] {
        const [rootKey, subKey] = this.getKeys(rulekey, false);
        const set = this.#rules[rootKey] ?? {};
        const rules = subKey !== undefined
            ? set[subKey] ?? []
            : Object.keys(set).reduce((p, c) =>
                (p.push(...set[c]), p), <RuntimeLimitRule[]>[]);
        return rules.map(r => r.displayText(rootKey, this.scopeName));
    }

    public serialize(): SerializedRuntimeLimit {
        const result: SerializedRuntimeLimit = { rules: {}, type: this.#name };

        for (const rootKey of Object.keys(this.#rules)) {
            const ruleSet = this.#rules[rootKey];
            if (ruleSet === undefined)
                continue;

            for (const subKey of Object.keys(ruleSet))
                result.rules[`${rootKey}:${subKey}`] = ruleSet[subKey].map(r => r.state());
        }

        return result;
    }

    public load(state: SerializedRuntimeLimit): void {
        for (const ruleKey of Object.keys(state)) {
            const [rootKey, subKey] = this.getKeys(ruleKey);
            const states = state.rules[ruleKey];

            const set = this.#rules[rootKey];
            if (set === undefined)
                continue;

            const rules = set[subKey];
            if (rules === undefined)
                continue;

            const iter = Math.min(states.length, rules.length);
            for (let i = 0; i < iter; i++)
                rules[i].load(states[i]);
        }
    }
}
