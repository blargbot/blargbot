import { humanize } from '..';
import { User } from 'eris';

export function formatAuditReason(user: User, reason: string, ban = false): string {
    let fullReason = humanize.fullName(user);
    if (reason) {
        fullReason += `: ${reason}`;
    }
    // bans use their own system and cannot be uriencoded. thanks discord!
    return !ban ? encodeURIComponent(fullReason) : fullReason;
}