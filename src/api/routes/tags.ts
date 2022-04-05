import { Api } from '@blargbot/api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { StoredTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';

export class TagsRoute extends BaseRoute {
    public constructor(private readonly api: Api) {
        super('/tags');

        this.addRoute('/:tagName', {
            get: req => this.getTag(req.params.tagName),
            patch: req => this.editTag(req.params.tagName, req.body, this.getUserId(req)),
            post: req => this.setTag(req.params.tagName, req.body, this.getUserId(req)),
            delete: req => this.deleteTag(req.params.tagName, this.getUserId(req))
        });
    }

    public async getTag(tagName: string): Promise<ApiResponse> {
        const tag = await this.api.database.tags.get(tagName);
        if (tag === undefined)
            return this.notFound();

        return this.ok({
            name: tag.name,
            content: tag.content,
            author: tag.author
        });
    }

    public async setTag(tagName: string, body: unknown, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.unauthorized();

        const mapped = mapCreateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.tags.get(tagName);
        if (current !== undefined && current.author !== author)
            return this.forbidden(`The tag ${tagName} is owned by someone else`);

        const tag: StoredTag = {
            ...mapped.value,
            author: author,
            lastmodified: new Date(),
            name: tagName,
            uses: 0
        };
        const success = await this.api.database.tags.set(tag);

        if (!success)
            return this.internalServerError('Failed to save tag');

        return this.created(tag);
    }

    public async editTag(tagName: string, body: unknown, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.unauthorized();

        const mapped = mapUpdateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await this.api.database.tags.get(tagName);
        if (current === undefined)
            return this.notFound();

        if (current.author !== author)
            return this.forbidden(`You are not the author of the tag ${tagName}`);

        const tag: Partial<StoredTag> = {
            ...mapped.value,
            author: author
        };
        if (tag.name !== undefined && tag.name !== tagName && await this.api.database.tags.get(tag.name) !== undefined)
            return this.badRequest(`The tag ${tag.name} already exists`);

        if (!await this.api.database.tags.update(tagName, tag))
            return this.internalServerError('Failed to update');

        return this.ok(await this.api.database.tags.get(tag.name ?? tagName));
    }

    public async deleteTag(name: string, author: string | undefined): Promise<ApiResponse> {
        if (author === undefined)
            return this.unauthorized();

        const tag = await this.api.database.tags.get(name);
        if (tag === undefined)
            return this.notFound();

        if (tag.author !== author)
            return this.forbidden('You are not the author of this tag');

        if (!await this.api.database.tags.delete(name))
            return this.internalServerError('Failed to delete');

        return this.noContent();
    }
}

const mapCreateTag = mapping.object({
    content: mapping.string
});

const mapUpdateTag = mapping.object({
    content: mapping.string.optional,
    name: mapping.string.optional
});
