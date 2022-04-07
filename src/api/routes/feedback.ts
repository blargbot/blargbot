import { Api } from '../Api';
import { BaseRoute } from '../BaseRoute';
import { ApiResponse } from '../types';

export class FeedbackRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/feedback');

        this.addRoute('/:id/url', {
            get: (req) => this.getFeedbackUrl(req.params.id)
        });
    }

    public getFeedbackUrl(id: string): ApiResponse {
        return this.ok(`https://airtable.com/${this.api.config.airtable.public}/${this.api.config.airtable.suggestions}/${id}`);
    }
}
