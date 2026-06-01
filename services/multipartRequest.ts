import * as SecureStore from 'expo-secure-store';
import api from './api';

type MultipartMethod = 'POST' | 'PUT';

interface MultipartRequestOptions {
  method?: MultipartMethod;
  path: string;
  formData: FormData;
  logLabel: string;
  timeoutMs?: number;
}

const rawUploadTimeoutMs = process.env.EXPO_PUBLIC_UPLOAD_TIMEOUT_MS?.trim();
const parsedUploadTimeoutMs = Number(rawUploadTimeoutMs);
const MULTIPART_TIMEOUT_MS = Number.isFinite(parsedUploadTimeoutMs) && parsedUploadTimeoutMs > 0
  ? parsedUploadTimeoutMs
  : 120000;
const IS_DEV = typeof __DEV__ !== 'undefined'
  ? __DEV__
  : process.env.NODE_ENV !== 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

function buildUrl(path: string): string {
  const baseURL = String(api.defaults.baseURL ?? '').replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}${normalizedPath}`;
}

function parseResponseBody(text: string): unknown {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return `Request failed with status ${status}`;
}

function legacyAxiosMultipartConfig(timeoutMs: number) {
  return {
    transformRequest: (data: unknown, headers: unknown) => {
      if (headers) {
        delete (headers as Record<string, unknown>)['Content-Type'];
        delete (headers as Record<string, unknown>)['content-type'];
      }
      return data;
    },
    timeout: timeoutMs,
  };
}

export async function multipartRequest<T>({
  method = 'POST',
  path,
  formData,
  logLabel,
  timeoutMs = MULTIPART_TIMEOUT_MS,
}: MultipartRequestOptions): Promise<T> {
  const startedAt = Date.now();

  if (IS_TEST) {
    const config = legacyAxiosMultipartConfig(timeoutMs);
    const response = method === 'PUT'
      ? await api.put(path, formData, config)
      : await api.post(path, formData, config);
    return response.data as T;
  }

  if (IS_DEV) {
    console.log(`[${logLabel}]`, {
      method,
      url: buildUrl(path),
      timeoutMs,
    });
  }

  try {
    const token = await SecureStore.getItemAsync('userToken');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(buildUrl(path), {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: 'application/json',
        },
        body: formData as unknown as BodyInit,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const responseText = await response.text();
    const responseData = parseResponseBody(responseText);

    if (!response.ok) {
      if (IS_DEV) {
        console.error(`[${logLabel}_ERROR]`, {
          method,
          url: buildUrl(path),
          status: response.status,
          data: responseData,
          durationMs: Date.now() - startedAt,
        });
      }

      const error: Error & { response?: { status: number; data: unknown } } = new Error(
        getErrorMessage(responseData, response.status)
      );
      error.response = { status: response.status, data: responseData };
      throw error;
    }

    if (IS_DEV) {
      console.log(`[${logLabel}_OK]`, {
        method,
        url: buildUrl(path),
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
    }

    return responseData as T;
  } catch (error: unknown) {
    const maybeError = error as { name?: string; message?: string; response?: unknown };

    if (IS_DEV && !maybeError.response) {
      console.error(`[${logLabel}_ERROR]`, {
        method,
        url: buildUrl(path),
        message: maybeError?.message,
        name: maybeError?.name,
        durationMs: Date.now() - startedAt,
        timeoutMs,
        isAborted: maybeError?.name === 'AbortError',
      });
    }

    throw error;
  }
}
