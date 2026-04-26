jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

import api from '../api';
import { postService } from '../posts/postService';

class MockFormData {
  public fields: Array<[string, unknown]> = [];

  append(key: string, value: unknown) {
    this.fields.push([key, value]);
  }
}

describe('postService unit', () => {
  const originalFormData = global.FormData;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).FormData = MockFormData as any;
  });

  afterEach(() => {
    (global as any).FormData = originalFormData;
  });

  test('createPost envia form-data com campos obrigatorios, beachId e foto', async () => {
    const payload = { id: 10, descricao: 'Sessao classica' };
    (api.post as jest.Mock).mockResolvedValue({ data: payload });

    await expect(
      postService.createPost('Sessao classica', true, 42, 'file:///tmp/foto.jpg')
    ).resolves.toEqual(payload);

    expect(api.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = (api.post as jest.Mock).mock.calls[0];
    const fields = (formData as MockFormData).fields;

    expect(url).toBe('/api/posts');
    expect(config).toEqual({
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    expect(fields).toContainEqual(['descricao', 'Sessao classica']);
    expect(fields).toContainEqual(['publico', 'true']);
    expect(fields).toContainEqual(['beachId', '42']);

    const fotoField = fields.find(([key]) => key === 'foto');
    expect(fotoField).toBeDefined();
    expect(fotoField?.[1]).toEqual({
      uri: 'file:///tmp/foto.jpg',
      name: 'foto.jpg',
      type: 'image/jpg',
    });
  });

  test('createPost envia apenas campos obrigatorios quando opcionais nao forem informados', async () => {
    const payload = { id: 11, descricao: 'Sem opcional' };
    (api.post as jest.Mock).mockResolvedValue({ data: payload });

    await expect(postService.createPost('Sem opcional', false)).resolves.toEqual(payload);

    const [, formData] = (api.post as jest.Mock).mock.calls[0];
    const fields = (formData as MockFormData).fields;

    expect(fields).toEqual([
      ['descricao', 'Sem opcional'],
      ['publico', 'false'],
    ]);
  });

  test('createPost usa tipo generico quando arquivo nao tem extensao', async () => {
    const payload = { id: 12, descricao: 'Arquivo sem extensao' };
    (api.post as jest.Mock).mockResolvedValue({ data: payload });

    await expect(
      postService.createPost('Arquivo sem extensao', true, undefined, 'file:///tmp/foto')
    ).resolves.toEqual(payload);

    const [, formData] = (api.post as jest.Mock).mock.calls[0];
    const fields = (formData as MockFormData).fields;
    const fotoField = fields.find(([key]) => key === 'foto');

    expect(fotoField).toBeDefined();
    expect(fotoField?.[1]).toEqual({
      uri: 'file:///tmp/foto',
      name: 'foto',
      type: 'image',
    });
  });
});
