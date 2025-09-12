# Sistema Inteligente de Imagens de Grupos

Este sistema implementa carregamento inteligente de imagens para grupos do Telegram, utilizando múltiplas fontes com fallback automático.

## Como Funciona

### Hierarquia de Carregamento

1. **Imagem Original do Telegram (OpenGraph)**
   - Busca a imagem oficial do grupo via API OpenGraph
   - Utiliza proxies CORS para contornar restrições
   - Cache de 2 horas para dados OpenGraph

2. **Imagem do Google Storage (Fallback)**
   - Utiliza imagem salva previamente no Google Storage
   - Otimizada através do Image Proxy Service

3. **Avatar Gerado Automaticamente**
   - Gera avatar com iniciais do grupo usando UI Avatars
   - Fallback final garantido para todos os grupos

### Componentes

#### `IntelligentGroupImage`
Componente principal que implementa o carregamento inteligente:

```tsx
<IntelligentGroupImage
  telegramUrl="https://t.me/grupo"
  fallbackImageUrl="https://storage.googleapis.com/image.jpg"
  groupName="Nome do Grupo"
  alt="Descrição da imagem"
  className="w-full h-full"
  priority={false}
/>
```

#### `useIntelligentGroupImage`
Hook que gerencia a lógica de carregamento:

```tsx
const { imageUrl, isLoading, error, source } = useIntelligentGroupImage({
  telegramUrl,
  fallbackImageUrl,
  groupName,
  enabled: true
});
```

### Serviços

#### `TelegramOpenGraphService`
- Busca dados OpenGraph de links do Telegram
- Cache inteligente com limpeza automática
- Múltiplos proxies CORS para garantir disponibilidade
- Geração de avatars fallback

#### `ImageProxyService` (Aprimorado)
- Otimização e proxy de imagens
- Cache de 24 horas para URLs otimizadas
- Validação automática de URLs de imagem

### Benefícios

1. **Sempre Mostra Imagem**: Fallback garantido para todos os grupos
2. **Performance Otimizada**: Cache inteligente e lazy loading
3. **Qualidade Original**: Prioriza imagem oficial do Telegram
4. **Responsivo**: Adaptado para mobile e desktop
5. **SEO Friendly**: Alt texts adequados e estrutura semântica

### Componentes Atualizados

- ✅ `EnhancedGroupCard`
- ✅ `OptimizedGroupCard`
- ✅ `AdminGroupCard`
- ✅ `GroupCard`
- ✅ `GroupDescriptionModal`

### Cache e Performance

- **OpenGraph Cache**: 2 horas
- **Image Cache**: 24 horas
- **Lazy Loading**: Carregamento sob demanda
- **Progressive Loading**: Placeholder → Imagem
- **Error Recovery**: Fallback automático em caso de erro

### Monitoramento

O sistema registra logs detalhados para debugging:

```
🔍 Fetching Telegram OpenGraph image...
📸 Found Telegram image: https://...
✅ Using Telegram OpenGraph image
🔄 Trying storage fallback image...
🎨 Generating UI avatar fallback...
```

### Configuração

Para usar o sistema, simplesmente substitua componentes `LazyImage` por `IntelligentGroupImage` e forneça:

- `telegramUrl`: Link do grupo no Telegram
- `fallbackImageUrl`: Imagem de backup (opcional)
- `groupName`: Nome do grupo para geração de avatar
- `alt`: Texto alternativo para acessibilidade

O sistema cuida automaticamente de toda a lógica de carregamento, cache e fallback.