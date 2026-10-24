import type { TagVariableScope } from '@blargbot/domain';
import type { IFormattable } from '@blargbot/formatting';

import type { BBTagContext } from './BBTagContext.js';

export interface VariableStore {
    get(scope: TagVariableScope, name: string): Promise<JToken | undefined>;
    upsert(scope: TagVariableScope, entries: Record<string, JToken | undefined>): Promise<void>;
}

export interface ScopeFactoryOptions extends TagVariableScopeKind {
    bind(context: BBTagContext): TagVariableScope;
}

export function createTagVariableScopeFactory(store: VariableStore, scopeFactories: Iterable<ScopeFactoryOptions>): TagVariableScopeFactory {
    const options = [...scopeFactories];
    return {
        kinds: options.map(({ description, name, prefix }) => ({ description, name, prefix })),
        createScopeProvider(context) {
            const entries = options.map<TagVariableScopeEntry>(x => {
                const scope = x.bind(context);
                return {
                    description: x.description,
                    name: x.name,
                    prefix: x.prefix,
                    scope,
                    get: name => store.get(scope, name),
                    upsert: entries => store.upsert(scope, entries)
                };
            });
            return {
                entries,
                find(name) {
                    return entries.find(e => name.startsWith(e.prefix));
                }
            };
        }
    };
}

export interface TagVariableScopeEntry extends TagVariableScopeDetails {
    get(name: string): Promise<JToken | undefined>;
    upsert(entries: Record<string, JToken | undefined>): Promise<void>;
}

export interface TagVariableScopeProvider {
    readonly entries: readonly TagVariableScopeEntry[];
    find(name: string): TagVariableScopeEntry | undefined;
}

export interface TagVariableScopeKind {
    readonly description: IFormattable<string>;
    readonly name: IFormattable<string>;
    readonly prefix: string;
}

export interface TagVariableScopeDetails extends TagVariableScopeKind {
    readonly scope: TagVariableScope;
}

export interface TagVariableScopeFactory {
    readonly kinds: readonly TagVariableScopeKind[];
    createScopeProvider(context: BBTagContext): TagVariableScopeProvider;
}
