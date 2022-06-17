import { StoredGuildEventLogType } from './StoredGuildEventLogType';

export interface StoredGuildEventLogConfig {
    readonly events: { readonly [P in StoredGuildEventLogType]?: string | undefined; };
    readonly roles: { readonly [roleId: string]: string | undefined; };
}
