import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { tagTypeDetails } from '@blargbot/bbtag/utils';
import { SubtagListResult } from '@blargbot/cluster/types';
import { format } from '@blargbot/formatting';

export class SubtagsRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/subtags');

        this.#api = api;

        this.addRoute('/', {
            get: () => this.listSubtags()
        }).addRoute('/:subtagName', {
            get: ({ request }) => this.getSubtag(request.params.subtagName)
        }).addRoute('/meta/categories', {
            get: () => this.getCategories()
        });
    }

    public async listSubtags(): Promise<ApiResponse> {
        const subtags: SubtagListResult = await this.#api.worker.request('getSubtagList', undefined);
        return this.ok(subtags);
    }

    public async getSubtag(name: string): Promise<ApiResponse> {
        const subtag = await this.#api.worker.request('getSubtag', name);
        if (subtag === undefined)
            return this.notFound();
        return this.ok(subtag);
    }

    public async getCategories(): Promise<ApiResponse> {
        const formatter = await this.#api.util.getFormatter();
        return this.ok(Object.fromEntries(
            Object.entries(tagTypeDetails)
                .map(([key, value]) => [key, {
                    ...value,
                    name: value.name[format](formatter),
                    desc: value.desc[format](formatter)
                }] as const)
        ));
    }
}
