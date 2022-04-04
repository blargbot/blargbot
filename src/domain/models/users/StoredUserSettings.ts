export interface StoredUserSettings {
    readonly dontdmerrors?: boolean;
    readonly prefixes?: readonly string[];
    readonly blacklisted?: string;
    readonly timezone?: string;
}
