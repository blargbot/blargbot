import type { Api } from '../Api.js';
import { BaseRoute } from '../BaseRoute.js';
import type { ApiResponse } from '../types.js';

export class FeedbackRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super('/feedback');

        this.#api = api;

        this.addRoute('/:id/url', {
            get: ({ request }) => this.getFeedbackUrl(request.params.id)
        });
    }

    public getFeedbackUrl(id: string): ApiResponse {
        return this.ok(`https://airtable.com/${this.#api.config.airtable.base}/${this.#api.config.airtable.suggestions}/${id}`);
    }
}
