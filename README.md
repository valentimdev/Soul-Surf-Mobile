# Soul Surf Mobile

<p align="center">
  <strong>Aplicativo mobile para surfistas conectando mapeamento de picos de surf, relatórios climáticos em tempo real e uma comunidade ativa.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.81-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-54-000000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Jest-30-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest">
</p>

## Sobre o Projeto

O **Soul Surf Mobile** é um aplicativo móvel completo desenvolvido com React Native e Expo, projetado para revolucionar a forma como surfistas monitoram as condições do mar, descobrem novos locais e interagem com a comunidade. O aplicativo une o mapeamento interativo de praias através do MapLibre/OpenStreetMap a um interpretador inteligente de condições de surf com alta acurácia (83 cenários validados por testes unitários).

Além do monitoramento de picos, o aplicativo integra uma rede social completa com feeds personalizados, compartilhamento de sessões com fotos, curtidas, sistema dinâmico de comentários aninhados (respostas), perfis clicáveis de usuários e um chat em tempo real via WebSocket por pico de surf.

**Fluxo de Funcionamento e Navegação:**
```
MAPA (MapLibre) → Busca de Praias, Clustering de Spots e Coordenadas
                         ↓
DETALHES DA PRAIA → Clima em tempo real (Interpretador) + Chat (Websockets)
                         ↓
SOCIAL (Feed & Perfis) → Compartilhamento, likes, comentários aninhados e conexões
```

**Mapeamento de Módulos ↔ Responsabilidades:**
- **Mapa e POIs**: Localização geográfica, georeferenciamento e novos spots (Google Forms POIs).
- **Clima e Previsão**: Motor de regras climáticas (Bronze/Silver/Gold do mar) interpretando marés, ventos e ondas.
- **Comunidade Social**: Feed, curtidas, respostas a comentários e perfis clicáveis de usuários.
- **Moderação / Admin**: Dashboard administrativo para gerenciar denúncias e integridade da plataforma.

---

## Funcionalidades Principais

- **Mapeamento Geográfico**: Mapa interativo com pins personalizados, clustering e centralização automática de localização.
- **Interpretador de Condições de Surf**: Motor lógico robusto para classificar a qualidade da onda ("Fraca", "Moderada", "Boa", "Excelente").
- **Comunidade & Feed**: Compartilhamento de posts contendo upload de fotos via `FormData` e visualização em feeds personalizados.
- **Comentários Aninhados (Replies)**: Respostas estruturadas em árvore com indentação visual e conexão direta com perfis de usuários.
- **Chat por Pico em Tempo Real**: Conversas interativas e em tempo real em cada spot integrando conexões WebSocket/STOMP.
- **Segurança e Moderação**: Ferramentas administrativas para gerenciar banimentos, posts e exclusão de mensagens impróprias.

---

## Guia de Instalação e Execução

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento localmente.

### Pré-requisitos

- Node.js (v18+)
- NPM ou Yarn
- Expo Go instalado no smartphone (Android/iOS) ou Emuladores

### Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/valentimdev/Soul-Surf-Mobile
   cd Soul-Surf-Mobile
   ```

2. **Configure o arquivo de ambiente:**
   Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
   ```bash
   EXPO_PUBLIC_API_URL=https://api.sua-url-backend.com
   ```
   *Nota: Se `EXPO_PUBLIC_API_URL` não for definido, o app usa um fallback HTTP de desenvolvimento local automaticamente.*

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor Expo:**
   ```bash
   npm start
   ```

5. **Rode a suíte de testes automatizados:**
   ```bash
   npm test
   ```

---

## Documentação do App e Fluxos

### **1. MAPA & PREVISÃO DE CLIMA**

Mapeamento completo dos spots de surf brasileiros integrado com o motor de lógica climática da Open-Meteo.

| Módulo / Script | Descrição |
| :-------------- | :-------- |
| `app/(tabs)/map.tsx` | Renderização do mapa utilizando MapLibre com marcadores e clustering de praias |
| `utils/surfConditionsInterpreter.ts` | Motor de regras inteligente para decodificar vento, onda e período |

**O que faz:**
- Identifica a localização do usuário no mapa e centraliza a câmera.
- Plota praias e picos de surf, agrupando-os dinamicamente durante o zoom-out (clustering).
- O `surfConditionsInterpreter` lê o tamanho das ondas, o período e a velocidade/direção do vento.
- Classifica de forma inteligente e científica as condições em: **Fraca**, **Moderada**, **Boa** ou **Excelente**.
- Possui cobertura massiva de testes para validar a precisão com **83 cenários marítimos distintos**.

---

### **2. FEED & INTERAÇÕES DA COMUNIDADE**

Compartilhamento em tempo real de sessões de surf, engajamento, curtidas e comentários na rede social interna.

| Módulo / Script | Descrição |
| :-------------- | :-------- |
| `app/(tabs)/index.tsx` | Página inicial do Feed contendo as abas de feed Público e Seguindo |
| `app/post/[id].tsx` | Tela de detalhes de publicação, gerenciando likes, perfis e respostas |
| `app/user/[id].tsx` | Perfil público de outros surfistas, contendo conquistas e contribuições |

**O que faz:**
- Permite criar novos posts com descrição obrigatória e upload de imagem via `FormData` na API.
- **Respostas de comentários (Replies)**: Implementa um helper recursivo `flattenComments` para achatar a estrutura aninhada, aplicando recuos laterais inteligentes e linhas de ligação visual.
- **Navegação Inteligente**:
  - Avatares e nomes em posts/comentários são clicáveis e abrem diretamente o perfil do surfista (`/user/[id]`).
  - Badge clicável de localização no post redireciona o usuário para a tela da respectiva praia (`/beach/[id]`).
  - Posts na lista de contribuições do perfil público levam diretamente aos detalhes do post (`/post/[id]`).

---

### **3. REAL-TIME CHAT & DETALHES DO SPOT**

Espaço dinâmico dentro de cada praia para interações ao vivo no pico, permitindo que surfistas conversem e tirem dúvidas imediatas.

| Módulo / Script | Descrição |
| :-------------- | :-------- |
| `app/beach/[id].tsx` | Página de detalhes da praia, chat ao vivo e card com condições climáticas |
| `services/chat/chatSocket.ts` | Serviço de conexão em tempo real via WebSocket integrando STOMP.js |

**O que faz:**
- Abre a sala de chat exclusiva de cada praia.
- Exibe o card de condições climáticas traduzido pelo interpretador.
- Agrupa mensagens e respostas locais em tempo real de forma eficiente.
- Possibilita iniciar conversas no privado ou seguir usuários a partir do chat.

---

### **4. DASHBOARD ADMINISTRATIVO & MODERAÇÃO**

Interface exclusiva para administradores fiscalizarem posts, banirem contas ofensivas e limparem o banco de dados.

| Módulo / Script | Descrição |
| :-------------- | :-------- |
| `app/admin.tsx` | Tela restrita do painel admin, listando logs, denúncias e moderação |
| `services/admin/adminService.ts` | APIs de consulta admin, auditoria e controle de banco de dados |

**O que faz:**
- Lista denúncias de posts e comentários ofensivos.
- Permite que administradores visualizem a árvore inteira de comentários em logs achatados para auditoria rápida.
- Ações rápidas de banimento (`banUser`), desbanimento, remoção de posts e exclusão de mensagens impróprias.

---

## Estrutura do Projeto

O código-fonte segue a estrutura modular e organizada recomendada pela arquitetura React Native/Expo:

```
Soul-Surf-Mobile/
├── __mocks__/                  # Mocks globais para a suite de testes Jest
├── __tests__/                  # Testes automatizados (Componentes e Telas)
├── app/                        # Expo Router: Estrutura de arquivos e telas do app
│   ├── (tabs)/                 # Abas principais (Feed, Discover, Map, Profile, etc.)
│   ├── beach/                  # Sub-rotas de praias e picos de surf
│   ├── chat/                   # Sub-rotas de chats individuais
│   ├── post/                   # Detalhes e interações de publicações específicas
│   ├── user/                   # Visualização de perfis públicos de outros surfistas
│   ├── admin.tsx               # Painel Administrativo de Moderação
│   └── _layout.tsx             # Layout global de rotas e navegação
├── assets/                     # Recursos de mídia estáticos (ícones, logos, imagens)
├── components/                 # Componentes genéricos e BottomSheets reutilizáveis
├── constants/                  # Constantes e imagens padrão do sistema
├── contexts/                   # Provedores de contexto globais (Notificações, Temas)
├── database/                   # Arquivos relacionados a dados locais
├── hooks/                      # Hooks customizados do React
├── services/                   # Integração com a API Backend e WebSockets
│   ├── admin/                  # Serviços administrativos de auditoria
│   ├── auth/                   # Serviços de autenticação e tokens
│   ├── beaches/                # Serviços de praias e meteorologia
│   └── posts/                  # Serviços de posts, curtidas e comentários
├── types/                      # Definições globais de interfaces TypeScript (DTOs)
├── utils/                      # Funções utilitárias e formatadores de data/hora
├── App.json                    # Arquivo de configuração global do Expo
├── jest.config.js              # Configuração do framework de testes Jest
└── package.json                # Lista de dependências e scripts do projeto
```

---

## Tecnologias Utilizadas

- **React Native 0.81 & Expo 54**: Framework mobile e SDK principal
- **TypeScript 5.9**: Tipagem estática segura para todo o código
- **Expo Router**: Roteamento baseado em arquivos nativo e fluido
- **Jest & React Test Renderer**: Framework e utilitários de testes automatizados
- **STOMP.js & Socket.io**: Comunicação em tempo real por WebSockets
- **Axios & Axios Mock Adapter**: Requisições HTTP robustas e ambiente de simulação
- **MapLibre React Native**: Exibição e renderização de mapas interativos de performance

---

## Estatísticas de Integridade e Dados

- **214 testes automatizados** integrados e validados com sucesso
- **83 cenários marítimos** cobertos pelo interpretador de clima de ondas
- **16+ UFs do Brasil** contendo picos cadastrados e mapeados no aplicativo
- **100% de consistência** na tipagem estática e zero avisos de linters nos fluxos principais

