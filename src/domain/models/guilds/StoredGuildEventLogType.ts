export type StoredGuildEventLogType =
    | `role:${string}`
    | 'messagedelete'
    | 'messageupdate'
    | 'nameupdate'
    | 'avatarupdate'
    | 'nickupdate'
    | 'memberjoin'
    | 'memberleave'
    | 'memberunban'
    | 'memberban'
    | 'kick';
