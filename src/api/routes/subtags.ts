import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { tagTypeDetails } from '@blargbot/bbtag/utils';
import { SubtagListResult } from '@blargbot/cluster/types';

export class SubtagsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/subtags');

        this.addRoute('/', {
            get: () => this.listSubtags()
        }).addRoute('/:subtagName', {
            get: ({ request }) => this.getSubtag(request.params.subtagName)
        }).addRoute('/meta/categories', {
            get: () => this.getCategories()
        });
    }

    public async listSubtags(): Promise<ApiResponse> {
        const subtags: SubtagListResult = await this.api.worker.request('getSubtagList', undefined);
        return this.ok(subtags);
    }

    public async getSubtag(name: string): Promise<ApiResponse> {
        const subtag = await this.api.worker.request('getSubtag', name);
        if (subtag === undefined)
            return this.notFound();
        return this.ok(subtag);
    }

    public getCategories(): ApiResponse {
        return this.ok(tagTypeDetails);
    }
}
