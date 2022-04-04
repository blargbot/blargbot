import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';

export class OutputsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/outputs');

        this.addRoute('/:id', {
            get: (req) => this.getOutput(req.params.id)
        });
    }

    public async getOutput(id: string): Promise<ApiResponse> {
        const dump = await this.api.worker.request('getDump', id);

        if (dump === undefined)
            return this.notFound();
        return this.ok(dump);
    }
}
