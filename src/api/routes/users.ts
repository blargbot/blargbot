import type { Api } from '../Api.js';
import { BaseRoute } from '../BaseRoute.js';
import type { ApiResponse } from '../types.js';

export class UsersRoute extends BaseRoute<['/users']> {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/users');

        this.#api = api;

        this.addRoute('/@me', {
            get: ({ request }) => this.getUser(this.getUserId(request))
        });
    }

    public async getUser(userId: string): Promise<ApiResponse> {
        const user = await this.#api.util.getUser(userId);
        if (user === undefined)
            return this.notFound();

        return this.ok(user);
    }
}
