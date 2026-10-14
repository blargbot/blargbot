import type { AuthorVariableScope, GlobalVariableScope, GuildCCVariableScope, GuildTagVariableScope, LocalCCVariableScope, LocalTagVariableScope, TagVariableScope } from '@blargbot/domain';
import { TagVariableType } from '@blargbot/domain';
import type { IFormattable } from '@blargbot/formatting';

import { templates } from './text.js';

export interface VariableStore {
    get(scope: TagVariableScope, name: string): Promise<JToken | undefined>;
    upsert(scope: TagVariableScope, entries: Record<string, JToken | undefined>): Promise<void>;
}

export function createTagVariableScopeProvider(): TagVariableScopeProvider;
export function createTagVariableScopeProvider(store: VariableStore, scopes: {
    readonly local?: LocalTagVariableScope | LocalCCVariableScope;
    readonly author?: AuthorVariableScope;
    readonly guild?: GuildTagVariableScope | GuildCCVariableScope;
    readonly global?: GlobalVariableScope;
}): TagVariableScopeProvider
export function createTagVariableScopeProvider(store?: VariableStore, scopes: {
    readonly local?: LocalTagVariableScope | LocalCCVariableScope;
    readonly author?: AuthorVariableScope;
    readonly guild?: GuildTagVariableScope | GuildCCVariableScope;
    readonly global?: GlobalVariableScope;
} = {}): TagVariableScopeProvider {
    const entries: readonly TagVariableScopeEntry[] = [
        createEntry(store, scopes.guild, {
            name: templates.subtag.variables.server.name,
            prefix: '_',
            description: templates.subtag.variables.server.description
        }),
        createEntry(store, scopes.author, {
            name: templates.subtag.variables.author.name,
            prefix: '@',
            description: templates.subtag.variables.author.description
        }),
        createEntry(store, scopes.global, {
            name: templates.subtag.variables.global.name,
            prefix: '*',
            description: templates.subtag.variables.global.description
        }),
        createEntry(store, undefined, {
            name: templates.subtag.variables.temporary.name,
            prefix: '~',
            description: templates.subtag.variables.temporary.description
        }),
        createEntry(store, scopes.local, {
            name: templates.subtag.variables.local.name,
            prefix: '',
            description: templates.subtag.variables.local.description
        })
    ];
    return {
        isTag: scopes.local?.type === TagVariableType.LOCAL_TAG,
        tagName: scopes.local?.name ?? 'unknown',
        entries,
        find(name) {
            return entries.find(e => name.startsWith(e.prefix));
        }
    };
}

function createEntry(store: VariableStore | undefined, scope: TagVariableScope | undefined, props: Omit<TagVariableScopeEntry, 'get' | 'upsert' | 'scope'>): TagVariableScopeEntry {
    if (store === undefined || scope === undefined) {
        return {
            ...props,
            scope,
            get: () => Promise.resolve(undefined),
            upsert: () => Promise.resolve()
        };
    }

    return {
        ...props,
        scope,
        get: name => store.get(scope, name),
        upsert: entries => store.upsert(scope, entries)
    };
}

export interface TagVariableScopeEntry {
    readonly name: IFormattable<string>;
    readonly prefix: string;
    readonly description: IFormattable<string>;
    readonly scope: TagVariableScope | undefined;
    get(name: string): Promise<JToken | undefined>;
    upsert(entries: Record<string, JToken | undefined>): Promise<void>;
}

export interface TagVariableScopeProvider {
    readonly isTag: boolean;
    readonly tagName: string;
    readonly entries: readonly TagVariableScopeEntry[];
    find(name: string): TagVariableScopeEntry | undefined;
}
