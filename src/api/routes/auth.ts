import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { config } from '@blargbot/config';
import { Request } from 'express';
import fetch from 'node-fetch';

import Security from '../Security';

const baseEndpoint = 'https://discordapp.com/api/v9/';
const tokenEndpoint = 'https://discordapp.com/api/oauth2/token';
const userEndpoint = baseEndpoint + 'users/@me';

/* eslint-disable @typescript-eslint/naming-convention */
type AccessTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export class AuthRoute extends BaseRoute {
    public constructor() {
        super('/auth');

        this.addRoute('/validate', {
            get: (req) => this.validate(req)
        });
    }

    public async validate(request: Request): Promise<ApiResponse> {
        const params = new URLSearchParams();
        params.append('client_id', config.website.clientId);
        params.append('client_secret', config.website.secret);
        params.append('grant_type', 'authorization_code');
        params.append('code', request.query.code as string);
        params.append('redirect_uri', config.website.callback);
        params.append('scope', 'identify');

        const tokenRes = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const token = await tokenRes.json() as AccessTokenResponse;
        const userRes = await fetch(userEndpoint, {
            headers: {
                authorization: 'Bearer ' + token.access_token
            }
        });
        const user = await userRes.json() as { id: string; };

        const blargbotToken = Security.generateToken(user.id);

        return this.ok(blargbotToken);
    }
}
