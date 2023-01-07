export abstract class PermissionPlugin {
    public abstract check(permission: bigint, channelId?: string | null): PermissionStateHelper;
}

export const enum PermissionState {
    MISSING = 0,
    SERVICE = 1,
    AUTHOR = 2,
    USER = 4,

    SERVICE_AND_AUTHOR = SERVICE | AUTHOR,
    SERVICE_AND_USER = SERVICE | USER,
    AUTHOR_AND_USER = AUTHOR | USER,
    ALL = SERVICE | AUTHOR | USER
}

export class PermissionStateHelper {
    public readonly state: PermissionState;

    public get isMissing(): boolean { return this.hasAny(~0); }
    public get hasService(): boolean { return this.has(PermissionState.SERVICE); }
    public get hasUser(): boolean { return this.has(PermissionState.USER); }
    public get hasAuthor(): boolean { return this.has(PermissionState.AUTHOR); }

    public constructor(state: PermissionState) {
        this.state = state;
    }

    public has(state: PermissionState): boolean {
        return (this.state & state) === state;
    }

    public hasAny(state: PermissionState): boolean {
        return (this.state & state) !== 0;
    }
}
