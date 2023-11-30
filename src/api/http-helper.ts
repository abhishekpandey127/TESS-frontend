import axios, { AxiosRequestConfig } from 'axios';

const HEADERS = {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
    authorization: 'Bearer ed8fe605-0b48-4410-b00a-fc3f6f91c883',
};

const baseURL = 'https://api-dev-config-user.futurerx.com/api/';

type RequestOptions = AxiosRequestConfig & { [key: string]: any };

const defaultTransforms = axios.defaults.transformResponse || ((u) => u);
const defaultTransformsArray = Array.isArray(defaultTransforms) ? defaultTransforms : [defaultTransforms];

const remote = axios.create({
    baseURL,
    transformResponse: [...defaultTransformsArray],
});

export default {
    getParams(args: { [key: string]: string | undefined }): URLSearchParams {
        const params = Object.entries(args).reduce(
            (params, [key, value]) => (value ? { ...params, [key]: value } : params),
            {},
        );
        return new URLSearchParams(params);
    },

    postHeaders() {
        return HEADERS;
    },

    getHeaders() {
        return this.postHeaders();
    },

    async get(url: string, config: RequestOptions = {}) {
        const headers = this.getHeaders();
        return await remote.get(url, { ...config, headers });
    },

    async post(url: string, params: URLSearchParams | {} | null, config: RequestOptions = { withCredentials: true }) {
        const headers = this.postHeaders();
        return await remote.post(url, params, { ...config, headers });
    },

    async patch(url: string, params: Object, config: RequestOptions = {}) {
        const headers = this.getHeaders();
        return await remote.patch(url, params, { ...config, headers });
    },

    async put(url: string, params: Object, config: RequestOptions = {}) {
        const headers = this.getHeaders();
        return await remote.put(url, params, { ...config, headers });
    },

    async del(url: string, config: RequestOptions = {}) {
        const headers = this.getHeaders();
        return await remote.delete(url, { ...config, headers });
    },
};
