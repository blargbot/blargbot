import { User } from 'discord.js';

import * as humanize from '../humanize';

export function formatAuditReason(user: User, reason = '', ban = false): string {
    let fullReason = humanize.fullName(user);
    if (reason.length > 0) {
        fullReason += `: ${reason}`;
    }
    // bans use their own system and cannot be uriencoded. thanks discord!
    return !ban ? encodeURIComponent(fullReason) : fullReason;
}
