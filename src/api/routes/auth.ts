import { config } from '@blargbot/config';
import type { Request } from 'express-serve-static-core';
import z from 'zod';

import type { Api } from '../Api.js';
import { BaseRoute } from '../BaseRoute.js';
import Security from '../Security.js';
import type { ApiResponse } from '../types.js';

const baseEndpoint = 'https://discordapp.com/api/v9/';
const tokenEndpoint = 'https://discordapp.com/api/oauth2/token';
const userEndpoint = `${baseEndpoint}users/@me`;

/* eslint-disable @typescript-eslint/naming-convention */
type AccessTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export class AuthRoute extends BaseRoute<['/auth']> {
    public constructor() {
        super('/auth');

        this.addRoute('/validate', {
            post: ({ request, api }) => this.validate(request, api)
        });
    }

    public async validate(request: Request, api: Api): Promise<ApiResponse> {
        const body = await this.mapRequestValue(request.body, mapValidateBody);

        const params = new URLSearchParams();
        params.append('client_id', config.website.clientId);
        params.append('client_secret', config.website.secret);
        params.append('grant_type', 'authorization_code');
        params.append('code', body.code);
        params.append('redirect_uri', config.website.callback);
        params.append('scope', 'identify');

        const tokenRes = await api.fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const token = await tokenRes.json() as AccessTokenResponse;
        const userRes = await api.fetch(userEndpoint, {
            headers: {
                authorization: `Bearer ${token.access_token}`
            }
        });
        const user = await userRes.json() as { id: string; };

        const blargbotToken = Security.generateToken(user.id);

        return this.ok(blargbotToken);
    }
}

const mapValidateBody = z.compile(z.object({
    code: z.string()
}));
