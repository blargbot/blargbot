import type { StoredGuildEventLogType } from './StoredGuildEventLogType.js';

export interface StoredGuildEventLogConfig {
    readonly events: { readonly [P in StoredGuildEventLogType]?: string | undefined; };
    readonly roles: { readonly [roleId: string]: string | undefined; };
}
