export class ApiError extends Error {
    constructor(public status: number, message: string, public data?: any) {
        super(message);
        this.name = 'ApiError';
    }
}

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
    const isFormData = options?.body instanceof FormData;

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(!isFormData && { 'Content-Type': 'application/json' }),
            ...options?.headers,
        },
    });

    let data: any = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    } else {
        // Handle non-JSON or empty response
        const text = await response.text();
        data = text ? { message: text } : {};
    }

    if (!response.ok) {
        throw new ApiError(
            response.status, 
            data?.error || data?.message || `API Error: ${response.status}`, 
            data
        );
    }

    return data as T;
}

export const apiClient = {
    get: <T>(url: string, options?: RequestInit) => fetcher<T>(url, { ...options, method: 'GET' }),
    post: <T>(url: string, body?: any, options?: RequestInit) =>
        fetcher<T>(url, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        }),
    patch: <T>(url: string, body?: any, options?: RequestInit) =>
        fetcher<T>(url, {
            ...options,
            method: 'PATCH',
            body: body instanceof FormData ? body : JSON.stringify(body)
        }),
    put: <T>(url: string, body?: any, options?: RequestInit) =>
        fetcher<T>(url, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        }),
    delete: <T>(url: string, options?: RequestInit) => fetcher<T>(url, { ...options, method: 'DELETE' }),
};
