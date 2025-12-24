# Claude Frontend Skills - PitchLab JP

Este documento define as habilidades e padrões de frontend que o Claude deve seguir ao trabalhar neste projeto.

## Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: React Server Components + Client Components
- **API Client**: Fetch API (nativo)

## Padrões de Código

### Componentes React

```typescript
// ✅ BOM: Componente Client com "use client"
"use client";

import { useState } from "react";

interface ComponentProps {
  text: string;
  className?: string;
}

export function Component({ text, className = "" }: ComponentProps) {
  const [state, setState] = useState<string>("");
  
  return (
    <div className={`base-classes ${className}`}>
      {text}
    </div>
  );
}
```

### Estilização com Tailwind

- Use classes utilitárias do Tailwind
- Mantenha consistência com o design system (cores ink-*)
- Prefira componentes reutilizáveis sobre estilos inline

### Estrutura de Arquivos

```
src/
  app/          # App Router (pages)
  components/   # Componentes reutilizáveis
  lib/          # Utilitários e helpers
  types/        # TypeScript types
  hooks/        # Custom React hooks
```

## Design System

### Cores (Ink Palette)

- `ink-black`: #2a2a2a
- `ink-cornflower`: #82a8e5
- `ink-mint`: #a8e5d0
- `ink-coral`: #ff99a0
- Background: #FDFBF7 (paper texture)

### Componentes Base

- **Riso Cards**: `riso-card` class (bordas risograph)
- **Botões**: Estados hover, disabled, loading
- **Inputs**: Estilo consistente com feedback visual

## Boas Práticas

1. **TypeScript**: Sempre tipar props e retornos
2. **Acessibilidade**: Sempre incluir `aria-label` em botões sem texto
3. **Performance**: Usar `useMemo` e `useCallback` quando apropriado
4. **Error Handling**: Sempre tratar erros de API
5. **Loading States**: Sempre mostrar feedback visual durante carregamento

## Padrões de API

```typescript
// ✅ BOM: Função de API com tratamento de erro
export async function fetchData(text: string): Promise<Data> {
  const response = await fetch(`${API_URL}/endpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}
```

## Componentes Existentes

### AudioPlayer
- Localização: `src/components/PlayButton.tsx`
- Props: `text`, `size?`, `className?`
- Funcionalidade: TTS playback com controles

### PitchVisualizer
- Localização: `src/components/PitchVisualizer.tsx`
- Props: `words: WordPitch[]`
- Funcionalidade: Visualização de pitch accent

### WordCard
- Localização: `src/components/WordCard.tsx`
- Props: `word: WordPitch`
- Funcionalidade: Card individual de palavra com pitch

## Regras Específicas do Projeto

1. **Japonês First**: Texto em japonês deve ser renderizado corretamente
2. **Pitch Visualization**: Sempre mostrar padrão de pitch quando disponível
3. **Audio Integration**: Sempre incluir opção de playback quando relevante
4. **Mobile First**: Design responsivo é obrigatório
5. **Performance**: Otimizar para carregamento rápido (Next.js Image, lazy loading)

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

