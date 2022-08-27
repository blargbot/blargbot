import { Api } from '@blargbot/api/Api';

import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class DumpsRoute extends BaseRoute {
    public constructor() {
        super('/dumps');

        this.addRoute('/:id', {
            get: ({ request, api }) => this.getDump(api, request.params.id)
        });
    }

    public async getDump(api: Api, id: string): Promise<ApiResponse> {
        const dump = await api.database.dumps.get(id);
        if (dump === undefined)
            return this.notFound();
        return this.ok(dump);
    }
}
