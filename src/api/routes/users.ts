import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class UsersRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/users');

        this.addRoute('/@me', {
            get: req => this.getUser(this.getUserId(req))
        });
    }

    public async getUser(userId: string): Promise<ApiResponse> {
        const user = await this.api.util.getUser(userId);
        if (user === undefined)
            return this.notFound();

        return this.ok(user);
    }
}
