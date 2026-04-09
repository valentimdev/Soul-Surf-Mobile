import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';

type RouteResponse = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export type MockRequest = {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: IncomingMessage['headers'];
  rawBody: string;
  jsonBody: unknown;
};

export type MockRoute = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string | RegExp;
  response?: RouteResponse;
  handler?: (request: MockRequest) => RouteResponse | Promise<RouteResponse>;
};

function normalizePath(path: string): string {
  if (path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function pathMatches(routePath: string | RegExp, requestPath: string): boolean {
  if (routePath instanceof RegExp) {
    return routePath.test(requestPath);
  }

  return normalizePath(routePath) === normalizePath(requestPath);
}

function parseJsonOrRaw(rawBody: string): unknown {
  if (!rawBody) return null;

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

function toQueryObject(searchParams: URLSearchParams): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  return query;
}

export class MockHttpServer {
  private server: Server;
  private routes: MockRoute[] = [];
  private requests: MockRequest[] = [];
  public baseUrl = '';

  constructor() {
    this.server = createServer(async (req, res) => {
      const method = (req.method || 'GET').toUpperCase() as MockRoute['method'];
      const fullUrl = new URL(req.url || '/', 'http://localhost');
      const path = fullUrl.pathname;
      const query = toQueryObject(fullUrl.searchParams);

      const bodyBuffer: Buffer[] = [];
      req.on('data', (chunk) => bodyBuffer.push(Buffer.from(chunk)));
      await new Promise<void>((resolve) => req.on('end', resolve));
      const rawBody = Buffer.concat(bodyBuffer).toString('utf8');

      const request: MockRequest = {
        method,
        path,
        query,
        headers: req.headers,
        rawBody,
        jsonBody: parseJsonOrRaw(rawBody),
      };

      this.requests.push(request);

      const route = this.routes.find((candidate) =>
        candidate.method === method && pathMatches(candidate.path, path)
      );

      if (!route) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: `No mock route for ${method} ${path}` }));
        return;
      }

      const routeResponse = route.handler
        ? await route.handler(request)
        : (route.response ?? { status: 200, body: null });

      const status = routeResponse.status ?? 200;
      const body = routeResponse.body;
      const headers = routeResponse.headers ?? {};

      for (const [header, value] of Object.entries(headers)) {
        res.setHeader(header, value);
      }

      if (body === undefined || body === null) {
        res.statusCode = status;
        res.end();
        return;
      }

      if (typeof body === 'string') {
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'text/plain');
        }
        res.statusCode = status;
        res.end(body);
        return;
      }

      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      res.statusCode = status;
      res.end(JSON.stringify(body));
    });
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = this.server.address() as AddressInfo;
    this.baseUrl = `http://127.0.0.1:${address.port}`;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  setRoutes(routes: MockRoute[]): void {
    this.routes = routes;
    this.requests = [];
  }

  getRequests(): MockRequest[] {
    return [...this.requests];
  }

  getLastRequest(method: MockRoute['method'], path: string): MockRequest | undefined {
    const filtered = this.requests.filter(
      (request) => request.method === method && normalizePath(request.path) === normalizePath(path)
    );
    return filtered[filtered.length - 1];
  }
}

export async function setupMockHttpServer() {
  const server = new MockHttpServer();
  await server.start();
  return server;
}

