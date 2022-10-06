import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class FeedbackRoute extends BaseRoute {
    readonly #api: Api;

    public constructor(api: Api) {
        super(`/feedback`);

        this.#api = api;

        this.addRoute(`/:id/url`, {
            get: ({ request }) => this.getFeedbackUrl(request.params.id)
        });
    }

    public getFeedbackUrl(id: string): ApiResponse {
        return this.ok(`https://airtable.com/${this.#api.config.airtable.public}/${this.#api.config.airtable.suggestions}/${id}`);
    }
}
