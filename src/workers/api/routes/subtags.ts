import { Api } from '@api';
import { BaseRoute } from '@api/BaseRoute';
import { ApiResponse } from '@api/types';
import { SubtagDetails, SubtagListResult } from '@cluster/types';

export class SubtagsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/subtags');

        this.addRoute('/', {
            get: () => this.listSubtags()
        }).addRoute('/:subtagName', {
            get: (req) => this.getSubtag(req.params.subtagName)
        });
    }

    public async listSubtags(): Promise<ApiResponse> {
        const subtags = await this.api.worker.request<undefined, SubtagListResult>('getSubtagList', undefined);
        return this.ok(subtags);
    }

    public async getSubtag(name: string): Promise<ApiResponse> {
        const subtag = await this.api.worker.request<string, SubtagDetails | undefined>('getSubtag', name);
        if (subtag === undefined)
            return this.notFound();
        return this.ok(subtag);
    }
}
