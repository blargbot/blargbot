import type { BBTagContext, TimezoneProvider as BBTagTimezoneProvider } from '@bbtag/blargbot';

export class TimezoneProvider implements BBTagTimezoneProvider {
    public get(context: BBTagContext, userId: string): Promise<string | undefined> {
        context;
        userId;
        throw new Error('Method not implemented.');
    }
}
// {
//     get: (_ctx, userId) => this.database.users.getProp(userId, 'timezone')
// }
