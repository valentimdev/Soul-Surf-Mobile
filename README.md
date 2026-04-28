# Soul Surf Mobile

Aplicativo mobile desenvolvido com Expo e React Native.

## Configuracao de API

Crie um arquivo `.env` baseado em `.env.example`:

```bash
EXPO_PUBLIC_API_URL=https://api.sua-url.com
```

Em ambiente de desenvolvimento e testes, se `EXPO_PUBLIC_API_URL` nao for definido, o app usa fallback HTTP para facilitar setup local.

Em producao, `EXPO_PUBLIC_API_URL` e obrigatorio e deve usar `https://`.

---

## 🚀 Novas Implementações Recentes

Abaixo estão as atualizações e melhorias mais recentes integradas ao aplicativo:

### 🗺️ Mapa, UI e UX
- **Melhorias de Interação no Mapa**: Foram feitos ajustes significativos na interface e na responsividade do toque no mapa.
- **Correção de Localização**: Resolução de problemas relacionados à centralização e visualização de localização.
- **Novo Ponto de Interesse (POI)**: O sistema de adicionar novos pontos de interesse voltou a utilizar o formulário do Google Forms.
- **Barra de Navegação Focada**: As abas de Notificação e Chat foram provisoriamente ocultadas da NavBar para concentrar a experiência de uso nas abas de Mapa e Perfil (ajuste da Sprint 3).

### 🏖️ Feed, Posts e Praias
- **Sessão de Postagens (PostCard)**: O componente `PostCard` foi refatorado para utilizar dados normalizados de likes e comentários.
- **Correção em Comentários nas Praias**: Bug corrigido que causava erro ao tentar abrir a página de detalhes de uma praia que continha comentários (`app/beach/[id].tsx`).
- **Serviço de Postagens (`postService.ts`)**: Implementação conectando-se a API, contemplando:
  - **Criação de Posts**: Suporte para criação de publicações contendo upload de imagens via `FormData`.
  - **Feeds**: Separação e paginação do Feed Público e Feed "Seguindo".
  - **Interações (Likes)**: Lógica completa para dar/tirar curtidas, verificar status e trazer a contagem total.
  - **Gestão de Posts**: Métodos para edição e exclusão de publicações próprias, além de busca por usuário específico.

### ⚙️ Arquitetura, Utils e Testes
- **Utilitários de Data**: A lógica de formatação de datas foi extraída para `utils/formatters.ts`, com sua respectiva cobertura de testes unitários.
- **Testes de Autenticação**: Cobertura ampliada com novos testes unitários e de integração para os serviços de auth (`authService`, `apiInterceptor`).
- **Organização da Suite de Testes**: Ajuste da localização dos arquivos de teste (ex: `map.test.tsx` movido para `__tests__`) para não gerar conflito com o bundler do Expo durante o build do app.
