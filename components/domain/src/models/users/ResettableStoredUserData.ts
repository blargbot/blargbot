import { UserTodo } from './UserTodo.js';

export interface ResettableStoredUserData {
    readonly todo: readonly UserTodo[];
    readonly dontdmerrors?: boolean;
    readonly prefixes?: readonly string[];
    readonly timezone?: string;
}
