import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class UsersRoute extends BaseRoute {
    public constructor() {
        super('/users');

        this.addRoute('/@me', {
            get: ({ request, api }) => this.getUser(api, this.getUserId(request))
        });
    }

    public async getUser(api: Api, userId: string): Promise<ApiResponse> {
        const user = await api.util.getUser(userId);
        if (user === undefined)
            return this.notFound();

        return this.ok(user);
    }
}
