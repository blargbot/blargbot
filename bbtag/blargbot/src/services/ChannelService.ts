import type { BBTagRuntime } from '../BBTagRuntime.js';
import type { Entities } from '../types.js';
import type { EntityFetchService } from './EntityFetchService.js';
import type { EntityQueryService } from './EntityQueryService.js';

export interface ChannelService extends EntityQueryService<Entities.Channel>, EntityFetchService<Entities.Channel, string> {
    getDmChannelId(context: BBTagRuntime, userId: string): Promise<string>;
    edit(context: BBTagRuntime, channelId: string, update: Partial<Entities.EditChannel>, reason?: string): Promise<undefined | { error: string; }>;
    delete(context: BBTagRuntime, channelId: string, reason?: string): Promise<undefined | { error: string; }>;
    create(context: BBTagRuntime, options: Entities.CreateChannel, reason?: string): Promise<Entities.Channel | { error: string; }>;
    setPermission(context: BBTagRuntime, channelId: string, overwrite: Entities.PermissionOverwrite, reason?: string): Promise<undefined | { error: string; }>;
}
