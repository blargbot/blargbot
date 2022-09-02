import { Api } from '@blargbot/api/Api';

import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class DumpsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/dumps');

        this.#api = api;

        this.addRoute('/:id', {
            get: ({ request }) => this.getDump(request.params.id)
        });
    }

    public async getDump(id: string): Promise<ApiResponse> {
        const dump = await this.#api.database.dumps.get(id);
        if (dump === undefined)
            return this.notFound();
        return this.ok(dump);
    }
}
