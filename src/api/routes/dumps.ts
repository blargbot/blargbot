import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class DumpsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/dumps');

        this.addRoute('/:id', {
            get: req => this.getDump(req.params.id)
        });
    }

    public async getDump(id: string): Promise<ApiResponse> {
        const dump = await this.api.database.dumps.get(id);
        if (dump === undefined)
            return this.notFound();
        return this.ok(dump);
    }
}
