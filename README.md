# Soul Surf Mobile

Aplicativo mobile desenvolvido com Expo e React Native.

## Configuracao de API

Crie um arquivo `.env` baseado em `.env.example`:

```bash
EXPO_PUBLIC_API_URL=https://api.sua-url.com
```

Em ambiente de desenvolvimento e testes, se `EXPO_PUBLIC_API_URL` nao for definido, o app usa fallback HTTP para facilitar setup local.

Em producao, `EXPO_PUBLIC_API_URL` e obrigatorio e deve usar `https://`.

