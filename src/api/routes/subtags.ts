import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { tagTypeDetails } from '@blargbot/bbtag/utils';

export class SubtagsRoute extends BaseRoute {
    public constructor() {
        super('/subtags');

        this.addRoute('/', {
            get: ({ api }) => this.listSubtags(api)
        }).addRoute('/:subtagName', {
            get: ({ request, api }) => this.getSubtag(api, request.params.subtagName)
        }).addRoute('/meta/categories', {
            get: () => this.getCategories()
        });
    }

    public async listSubtags(api: Api): Promise<ApiResponse> {
        const subtags = await api.worker.request('getSubtagList', undefined);
        return this.ok(subtags);
    }

    public async getSubtag(api: Api, name: string): Promise<ApiResponse> {
        const subtag = await api.worker.request('getSubtag', name);
        if (subtag === undefined)
            return this.notFound();
        return this.ok(subtag);
    }

    public getCategories(): ApiResponse {
        return this.ok(tagTypeDetails);
    }
}
