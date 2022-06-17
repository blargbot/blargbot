export interface CommandPermissions {
    readonly disabled?: boolean;
    readonly permission?: string;
    /** Role ids, names or mentions */
    readonly roles?: readonly string[];
    readonly hidden?: boolean;
}
