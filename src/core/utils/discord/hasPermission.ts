import { Constants, GuildChannel, Member } from 'eris';

import { hasFlag } from '../hasFlag';

export function hasPermission(member: Member | undefined, permission: keyof Constants['Permissions']): boolean;
export function hasPermission(channel: GuildChannel, member: Member | undefined, permission: keyof Constants['Permissions']): boolean
export function hasPermission(...args: ArgTypes): boolean {
    const [channel, member, permission] = splitArgs(args);
    if (member === undefined)
        return false;

    const permissions = channel === undefined
        ? member.permissions
        : channel.permissionsOf(member);

    return hasFlag(permissions.allow, Constants.Permissions[permission], Constants.Permissions.administrator);
}

type ArgTypes =
    | [member: Member | undefined, permission: keyof Constants['Permissions']]
    | [channel: GuildChannel, member: Member | undefined, permission: keyof Constants['Permissions']];
type SplitArgs =
    | [channel: GuildChannel | undefined, member: Member | undefined, permission: keyof Constants['Permissions']];

function splitArgs(args: ArgTypes): SplitArgs {
    if (args[0] instanceof GuildChannel)
        return args as SplitArgs;
    return [undefined, ...args] as SplitArgs;

}
