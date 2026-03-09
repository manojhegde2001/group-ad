export class ApiError extends Error {
    constructor(public status: number, message: string, public data?: any) {
        super(message);
        this.name = 'ApiError';
    }
}

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(response.status, data.error || 'Something went wrong', data);
    }

    return data as T;
}

export const apiClient = {
    get: <T>(url: string, options?: RequestInit) => fetcher<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, body?: any, options?: RequestInit) =>
        fetcher<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
    patch: <T>(url: string, body?: any, options?: RequestInit) =>
        fetcher<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    put: <T>(url: string, body?: any, options?: RequestInit) =>
        fetcher<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(url: string, options?: RequestInit) => fetcher<T>(url, { ...options, method: 'DELETE' }),
};
