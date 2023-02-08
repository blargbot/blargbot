import type { BBTagContext } from '../BBTagContext.js';
import type { Entities } from '../types.js';
import type { EntityFetchService } from './EntityFetchService.js';
import type { EntityQueryService } from './EntityQueryService.js';

export interface ChannelService extends EntityQueryService<Entities.Channel>, EntityFetchService<Entities.Channel, string> {
    getDmChannelId(context: BBTagContext, userId: string): Promise<string>;
    edit(context: BBTagContext, channelId: string, update: Partial<Entities.EditChannel>, reason?: string): Promise<undefined | { error: string; }>;
    delete(context: BBTagContext, channelId: string, reason?: string): Promise<undefined | { error: string; }>;
    create(context: BBTagContext, options: Entities.CreateChannel, reason?: string): Promise<Entities.Channel | { error: string; }>;
    setPermission(context: BBTagContext, channelId: string, overwrite: Entities.PermissionOverwrite, reason?: string): Promise<undefined | { error: string; }>;
}
