import { Api } from '@blargbot/api/Api';
import { BaseRoute } from '@blargbot/api/BaseRoute';
import { ApiResponse } from '@blargbot/api/types';
import { StoredTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';

export class TagsRoute extends BaseRoute {
    public constructor() {
        super('/tags');

        this.addRoute('/', {
            post: ({ request, api }) => this.createTag(api, request.body, this.getUserId(request))
        });

        this.addRoute('/:tagName', {
            get: ({ request, api }) => this.getTag(api, request.params.tagName),
            patch: ({ request, api }) => this.editTag(api, request.params.tagName, request.body, this.getUserId(request)),
            put: ({ request, api }) => this.setTag(api, request.params.tagName, request.body, this.getUserId(request)),
            delete: ({ request, api }) => this.deleteTag(api, request.params.tagName, this.getUserId(request))
        });
    }

    public async getTag(api: Api, tagName: string): Promise<ApiResponse> {
        const tag = await api.database.tags.get(tagName);
        if (tag === undefined)
            return this.notFound();

        return this.ok({
            name: tag.name,
            content: tag.content,
            author: tag.author
        });
    }

    public async setTag(api: Api, tagName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.tags.get(tagName);
        if (current === undefined)
            return await this.#createTag(api, tagName, mapped.value.content ?? '', author);
        return await this.#editTag(api, tagName, mapped.value, author, current);
    }

    public async createTag(api: Api, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapCreateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const { name: tagName, content } = mapped.value;

        const exists = await api.database.tags.get(tagName);
        if (exists !== undefined)
            return this.forbidden(`A tag with the name ${tagName} already exists`);

        return await this.#createTag(api, tagName, content, author);
    }

    async #createTag(api: Api, tagName: string, content: string, author: string): Promise<ApiResponse> {
        const tag: StoredTag = {
            content: content,
            author: author,
            lastmodified: new Date(),
            name: tagName,
            uses: 0
        };
        const success = await api.database.tags.set(tag);

        if (!success)
            return this.internalServerError('Failed to save tag');

        return this.created(tag);
    }

    public async editTag(api: Api, tagName: string, body: unknown, author: string): Promise<ApiResponse> {
        const mapped = mapUpdateTag(body);
        if (!mapped.valid)
            return this.badRequest();

        const current = await api.database.tags.get(tagName);
        if (current === undefined)
            return this.notFound();

        return await this.#editTag(api, tagName, mapped.value, author, current);
    }

    async #editTag(api: Api, tagName: string, update: Partial<StoredTag>, author: string, current: StoredTag): Promise<ApiResponse> {
        if (current.author !== author)
            return this.forbidden(`You are not the author of the tag ${tagName}`);

        const tag: Partial<StoredTag> = { ...update, author: author };
        if (tag.name !== undefined && tag.name !== tagName && await api.database.tags.get(tag.name) !== undefined)
            return this.badRequest(`The tag ${tag.name} already exists`);

        let success = false;
        if (update.name !== undefined && update.name !== tagName) {
            await api.database.tags.delete(tagName);
            tagName = update.name;
            await api.database.tags.add({ ...current, name: tagName });
            success = true;
        }

        if (!await api.database.tags.update(tagName, tag) || success)
            return this.internalServerError('Failed to update');

        const newTag = await api.database.tags.get(tag.name ?? tagName);
        if (newTag === undefined)
            return this.notFound();

        return this.ok(newTag);
    }

    public async deleteTag(api: Api, name: string, author: string): Promise<ApiResponse> {
        const tag = await api.database.tags.get(name);
        if (tag === undefined)
            return this.notFound();

        if (tag.author !== author)
            return this.forbidden('You are not the author of this tag');

        if (!await api.database.tags.delete(name))
            return this.internalServerError('Failed to delete');

        return this.noContent();
    }
}

const mapCreateTag = mapping.object({
    content: mapping.string,
    name: mapping.string
});

const mapUpdateTag = mapping.object({
    content: mapping.string.optional,
    name: mapping.string.optional
});
