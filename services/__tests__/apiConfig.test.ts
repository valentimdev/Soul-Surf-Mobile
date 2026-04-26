describe('api configuration', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.resetModules();
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }

    if (originalNodeEnv === undefined) {
      Reflect.deleteProperty(process.env, 'NODE_ENV');
      return;
    }

    process.env.NODE_ENV = originalNodeEnv;
  });

  test('usa EXPO_PUBLIC_API_URL removendo barras no final', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.soulsurf.com///';

    jest.resetModules();
    jest.isolateModules(() => {
      const api = require('../api').default;
      expect(api.defaults.baseURL).toBe('https://api.soulsurf.com');
    });
  });

  test('usa fallback quando EXPO_PUBLIC_API_URL nao for informado', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.NODE_ENV = 'test';

    jest.resetModules();
    jest.isolateModules(() => {
      const api = require('../api').default;
      expect(api.defaults.baseURL).toBe('http://147.15.58.134:8080');
    });
  });

  test('usa fallback quando EXPO_PUBLIC_API_URL vier vazio', () => {
    process.env.EXPO_PUBLIC_API_URL = '   ';
    process.env.NODE_ENV = 'test';

    jest.resetModules();
    jest.isolateModules(() => {
      const api = require('../api').default;
      expect(api.defaults.baseURL).toBe('http://147.15.58.134:8080');
    });
  });

  test('em production falha quando EXPO_PUBLIC_API_URL nao for definido', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.NODE_ENV = 'production';

    jest.resetModules();
    expect(() => {
      jest.isolateModules(() => {
        require('../api');
      });
    }).toThrow('EXPO_PUBLIC_API_URL is required in production.');
  });

  test('em production falha quando EXPO_PUBLIC_API_URL usar HTTP', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.insegura.com';
    process.env.NODE_ENV = 'production';

    jest.resetModules();
    expect(() => {
      jest.isolateModules(() => {
        require('../api');
      });
    }).toThrow('EXPO_PUBLIC_API_URL must use HTTPS in production.');
  });

  test('em production aceita EXPO_PUBLIC_API_URL com HTTPS', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.soulsurf.com/';
    process.env.NODE_ENV = 'production';

    jest.resetModules();
    jest.isolateModules(() => {
      const api = require('../api').default;
      expect(api.defaults.baseURL).toBe('https://api.soulsurf.com');
    });
  });
});
