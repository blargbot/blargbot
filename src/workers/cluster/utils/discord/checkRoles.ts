import { BBTagContext } from '@cluster/bbtag';
import { bbtagUtil } from '@cluster/utils';
import { GuildMember } from 'discord.js';

interface CheckRolesResult {
    member: GuildMember | undefined;
    roles: string[];
    hasRole: boolean[];
}

export async function checkRoles(
    context: BBTagContext,
    roleStr: string,
    userStr: string,
    quiet: boolean
): Promise<CheckRolesResult> {
    const roleExpr = /(\d{17,23})/;
    const deserialized = bbtagUtil.tagArray.deserialize(roleStr);
    const result: CheckRolesResult = {
        member: context.member,
        roles: [],
        hasRole: []
    };
    let roles: string[];
    if (userStr !== '') {
        delete result.member;
        const user = await context.getUser(userStr, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        });
        if (user !== undefined)
            result.member = await context.util.getMemberById(context.guild.id, user.id);
    }

    if (deserialized !== undefined && Array.isArray(deserialized.v))
        roles = deserialized.v as string[];
    else
        roles = [roleStr];

    for (const entry of roles) {
        const match = roleExpr.exec(entry);
        const role = context.guild.roles.cache.get(match !== null ? match[1] : ''); //TODO context.getRole
        if (role === undefined)
            continue;
        result.roles.push(role.id);
    }

    result.hasRole = result.roles.map(role => {
        if (result.member !== undefined)
            return context.util.hasRole(result.member, role, false);
        return false;
    });
    return result;
}
