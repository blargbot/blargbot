import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class FeedbackRoute extends BaseRoute {
    public constructor() {
        super('/feedback');

        this.addRoute('/:id/url', {
            get: ({ request, api }) => this.getFeedbackUrl(api, request.params.id)
        });
    }

    public getFeedbackUrl(api: Api, id: string): ApiResponse {
        return this.ok(`https://airtable.com/${api.config.airtable.public}/${api.config.airtable.suggestions}/${id}`);
    }
}
