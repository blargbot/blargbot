import { BBTagRuntimeError } from '../../BBTagRuntimeError.js';

export class UserNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('No user found', `${value} could not be found`);
    }
}
export class RoleNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('No role found', `${value} could not be found`);
    }
}
export class LegacyRoleNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('Role not found', `${value} could not be found`);
    }
}
export class ChannelNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('No channel found', `${value} could not be found`);
    }
}
export class LegacyChannelNotFoundError extends BBTagRuntimeError {
    public constructor(public readonly value: string) {
        super('Channel does not exist', `${value} could not be found`);
    }
}
export class FailedToEditRoleNoPermsError extends BBTagRuntimeError {
    public constructor() {
        super('Failed to edit role: no perms');
    }
}
export class FailedToCreateRoleNoPermsError extends BBTagRuntimeError {
    public constructor() {
        super('Failed to create role: no perms');
    }
}
export class FailedToDeleteRoleNoPermsError extends BBTagRuntimeError {
    public constructor() {
        super('Failed to delete role: no perms');
    }
}
export class FailedToCreateChannelNoPermsError extends BBTagRuntimeError {
    public constructor() {
        super('Failed to create channel: no perms');
    }
}
export class FailedToEditChannelNoPermsError extends BBTagRuntimeError {
    public constructor() {
        super('Failed to edit channel: no perms');
    }
}
export class FailedToMoveChannelNoPermsError extends BBTagRuntimeError {
    public constructor() {
        super('Failed to move channel: no perms');
    }
}
