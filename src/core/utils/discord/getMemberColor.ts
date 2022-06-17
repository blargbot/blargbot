import { Member } from 'eris';

export function getMemberColor(member: Member): number {
    let result = 0;
    let position = -Infinity;
    for (const id of member.roles) {
        const role = member.guild.roles.get(id);
        if (role === undefined || role.color === 0 || role.position > position)
            continue;

        position = role.position;
        result = role.color;
    }
    return result;
}
