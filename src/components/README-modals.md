# Sistema de Modais Modernos

## Características

✅ **Centralizados e responsivos** - Sempre no centro da tela  
✅ **Overlay semitransparente com blur** - Fundo escurecido com efeito glassmorphism  
✅ **Animações suaves** - Entrada: fade + slide up, Saída: fade + slide down  
✅ **Bordas grandes (2xl)** - Design moderno e arredondado  
✅ **Botão fechar discreto** - Canto superior direito, com hover effects  
✅ **Responsivo** - Mobile: quase tela cheia, Desktop: compacto (max 500-700px)  
✅ **Scroll bloqueado** - Automático via Radix UI  
✅ **Design minimalista** - Foco em UX limpo e moderno  

## Componentes Disponíveis

### 1. ModernModal (Genérico)
```tsx
import ModernModal from '@/components/ModernModal';

<ModernModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Título do Modal"
  description="Descrição opcional"
  size="md" // sm | md | lg | xl | full
>
  <div>Conteúdo personalizado aqui</div>
</ModernModal>
```

### 2. AuthModal (Login/Registro)
```tsx
import AuthModal from '@/components/AuthModal';

<AuthModal
  open={showAuth}
  onOpenChange={setShowAuth}
  onSuccess={() => console.log('Autenticado!')}
/>
```

### 3. GroupModal (Detalhes do Grupo)
```tsx
import GroupModal from '@/components/GroupModal';

<GroupModal
  group={selectedGroup}
  open={showGroupDetails}
  onOpenChange={setShowGroupDetails}
/>
```

### 4. ConfirmationModal (Confirmações)
```tsx
import { ConfirmationModal } from '@/components/ConfirmationModal';

<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Confirmar Exclusão"
  description="Esta ação não pode ser desfeita."
  confirmText="Excluir"
  cancelText="Cancelar"
  variant="destructive"
  isLoading={isDeleting}
/>
```

## Animações CSS Personalizadas

### Keyframes Disponíveis
- `modal-overlay-enter/exit` - Para overlays
- `modal-content-enter/exit` - Para conteúdo do modal
- `fade-in/slide-in` - Animações gerais

### Classes Utilitárias
- `.modal-overlay` - Overlay com blur
- `.modal-content` - Conteúdo com glassmorphism
- `.modal-enter/.modal-exit` - Animações de entrada/saída

## Design System Integration

Todos os modais usam:
- Cores semânticas do sistema (`hsl(var(--background))`, etc.)
- Tokens de sombras (`--shadow-lg`, `--shadow-elegant`)
- Bordas e raios consistentes (`--radius`)
- Tipografia do sistema (Inter font stack)

## Mobile First

- Mobile: `w-[calc(100vw-2rem)]` - Quase tela cheia
- Tablet: `max-w-md` - Compacto
- Desktop: `max-w-lg/xl` - Dependendo do conteúdo
- Altura máxima: `max-h-[calc(100vh-2rem)]` - Sempre visível

## Acessibilidade

- Foco automático gerenciado pelo Radix
- Escape key para fechar
- Click fora para fechar (opcional)
- Labels semânticos (sr-only)
- Contraste adequado
- Suporte a screen readers