import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { tagTypeDetails } from '@blargbot/cluster/utils/constants/subtagType';

export class SubtagsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/subtags');

        this.addRoute('/', {
            get: () => this.listSubtags()
        }).addRoute('/:subtagName', {
            get: (req) => this.getSubtag(req.params.subtagName)
        }).addRoute('/meta/categories', {
            get: () => this.getCategories()
        });
    }

    public async listSubtags(): Promise<ApiResponse> {
        const subtags = await this.api.worker.request('getSubtagList', undefined);
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
