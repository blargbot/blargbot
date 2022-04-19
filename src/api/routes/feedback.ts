import { Api } from '@blargbot/api/Api';

import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class FeedbackRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/feedback');

        this.addRoute('/:id/url', {
            get: ({ request }) => this.getFeedbackUrl(request.params.id)
        });
    }

    public getFeedbackUrl(id: string): ApiResponse {
        return this.ok(`https://airtable.com/${this.api.config.airtable.public}/${this.api.config.airtable.suggestions}/${id}`);
    }
}
