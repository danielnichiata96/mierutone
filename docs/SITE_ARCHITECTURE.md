# Mierutone - Site Architecture Plan

## Visão Geral

Arquitetura freemium: ferramenta gratuita poderosa (SEO, viral) + features Pro para monetização.

---

## Estrutura de Rotas

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ROTAS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PÚBLICAS (sem login)                                               │
│  ════════════════════                                               │
│                                                                      │
│  /                    Landing page                                  │
│                       - Hero com value prop                         │
│                       - Input demo rápido                           │
│                       - Features overview                           │
│                       - Social proof                                │
│                       - CTA para /app                               │
│                                                                      │
│  /app                 Ferramenta principal (FREE)                   │
│                       - Text input → análise                        │
│                       - WordCards com pitch                         │
│                       - PhraseFlow                                  │
│                       - TTS playback                                │
│                       - Tabs: [Praticar] [Exemplos] [Aprender]     │
│                                                                      │
│  /learn               Hub educativo (SEO)                           │
│  /learn/moras         O que são moras vs sílabas                    │
│  /learn/patterns      4 padrões: heiban, atamadaka, nakadaka, odaka│
│  /learn/particles     Como partículas herdam pitch                  │
│  /learn/compounds     Palavras compostas e McCawley                 │
│                                                                      │
│  /examples            Biblioteca de exemplos                        │
│  /examples/greetings  Cumprimentos (10 frases)                      │
│  /examples/numbers    Números e contadores                          │
│  /examples/verbs      Verbos comuns (50)                            │
│  /examples/minimal    Pares mínimos (箸/橋, 雨/飴)                   │
│  /examples/business   Japonês de negócios                           │
│                                                                      │
│  /pricing             Página de preços Free vs Pro                  │
│                                                                      │
│  ────────────────────────────────────────────────────────────────   │
│                                                                      │
│  PROTEGIDAS (login required) 🔐                                     │
│  ═══════════════════════════════                                    │
│                                                                      │
│  /dashboard           Área do usuário                               │
│                       - Histórico de análises                       │
│                       - Estatísticas de uso                         │
│                       - Progresso geral                             │
│                       - Palavras problemáticas                      │
│                                                                      │
│  /practice            Treino guiado                                 │
│                       - Decks por nível/tema                        │
│                       - Daily challenge                             │
│                       - Spaced repetition                           │
│                       - ML: palavras que você erra                  │
│                                                                      │
│  /compare             Record & Compare                              │
│                       - Gravação de áudio                           │
│                       - Score detalhado                             │
│                       - Feedback por mora                           │
│                       - Histórico de tentativas                     │
│                                                                      │
│  /export              Exportação                                    │
│                       - Anki deck generator                         │
│                       - CSV download                                │
│                       - API access                                  │
│                                                                      │
│  /settings            Configurações                                 │
│                       - Perfil                                      │
│                       - Billing (Stripe)                            │
│                       - Preferências                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Free vs Pro

### Tier Gratuito (Mass Adoption)

| Feature | Limite | Objetivo |
|---------|--------|----------|
| Análise de texto | Ilimitado | SEO, viralidade |
| PhraseFlow | Ilimitado | Diferencial visual |
| TTS Play | 50/dia | Custo controlado |
| Exemplos básicos | Todos | Valor imediato |
| Learn (conteúdo) | Todo | SEO, autoridade |
| Record & Compare | 3/dia | Taste of Pro |

### Tier Pro ($9/mês)

| Feature | Valor |
|---------|-------|
| Login + Conta | Persistência |
| Histórico completo | Lock-in |
| TTS ilimitado | Conveniência |
| Record & Compare ilimitado | Core training |
| Anki Export | Integração workflow |
| Decks ML personalizados | Valor único |
| Progress tracking | Motivação |
| Sem ads | Clean experience |
| Suporte prioritário | Premium feel |

---

## Componentes de UI

### Layout Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]  [App] [Learn] [Examples]              [Login] [Upgrade 🔥] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         {Page Content}                              │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Footer: About | Privacy | Terms | GitHub | Twitter                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout Logado

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]  [App] [Practice] [Compare]    [Dashboard] [Avatar ▼] [Pro]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Sidebar (em /dashboard, /practice):                                │
│  ┌──────────┐                                                       │
│  │ Overview │                                                       │
│  │ History  │  {Main Content}                                       │
│  │ Progress │                                                       │
│  │ Settings │                                                       │
│  └──────────┘                                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### App Page Tabs

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [Praticar]  [Exemplos]  [Aprender]                                 │
│  ─────────────────────────────────                                  │
│                                                                      │
│  Tab: Praticar (default)                                            │
│  ├── TextInput                                                      │
│  ├── WordCards grid                                                 │
│  └── PhraseFlow                                                     │
│                                                                      │
│  Tab: Exemplos                                                      │
│  ├── Category cards (Greetings, Numbers, Verbs, etc.)              │
│  └── Click → preenche input e analisa                              │
│                                                                      │
│  Tab: Aprender                                                      │
│  ├── Quick intro cards (Moras, Patterns, etc.)                     │
│  └── "Ver mais" → /learn/[topic]                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stack Técnica

### Auth
- **Clerk** - Login social (Google, GitHub), magic link
- Middleware para rotas protegidas
- Webhook para Stripe sync

### Database
- **Supabase** (PostgreSQL)
  - users (profile, preferences)
  - analysis_history (text, result, timestamp)
  - practice_sessions (deck, score, attempts)
  - subscriptions (plan, status, stripe_id)

### Payments
- **Stripe**
  - Checkout session para upgrade
  - Customer portal para billing
  - Webhooks para subscription status

### Analytics
- **PostHog** - Product analytics, feature flags
- **Plausible** - Privacy-friendly page analytics

---

## Fases de Implementação

### Fase 4.1 - Estrutura Base ✅
- [x] Layout com navegação pública
- [x] Rotas básicas (/app, /learn, /examples)
- [x] App page com tabs (Praticar já funciona)
- [x] Placeholder para Exemplos e Aprender

### Fase 4.2 - Conteúdo Educativo ✅
- [x] /learn pages com conteúdo sobre moras, padrões
- [x] /examples com biblioteca JSON (8 categorias, 80+ exemplos)
- [x] Cards de categoria clicáveis com AudioPlayButton
- [x] SEO meta tags (todas as páginas)

### Fase 4.3 - Landing Page ✅
- [x] Hero section com demo e CTAs
- [x] Features section (4 features com icons)
- [x] Social proof (community badges, feedback CTA)
- [x] Pricing preview (free tier destacado)
- [x] CTAs estratégicos (Try It Free, Learn Patterns)

### Fase 5.1 - Auth
- [ ] Clerk setup
- [ ] Login/signup flow
- [ ] Protected routes middleware
- [ ] User profile

### Fase 5.2 - Dashboard
- [ ] /dashboard layout
- [ ] Histórico de análises
- [ ] Estatísticas básicas
- [ ] Supabase integration

### Fase 5.3 - Monetização
- [ ] /pricing page
- [ ] Stripe checkout
- [ ] Plan gating (middleware)
- [ ] Upgrade prompts

### Fase 5.4 - Features Pro
- [ ] Record & Compare ilimitado
- [ ] Anki export
- [ ] Decks de treino
- [ ] Progress tracking

---

## Conteúdo JSON (Exemplos)

```json
{
  "categories": [
    {
      "id": "greetings",
      "name": "Cumprimentos",
      "name_jp": "挨拶",
      "icon": "👋",
      "items": [
        { "text": "おはようございます", "translation": "Good morning (polite)" },
        { "text": "こんにちは", "translation": "Hello" },
        { "text": "こんばんは", "translation": "Good evening" },
        { "text": "おやすみなさい", "translation": "Good night" },
        { "text": "ありがとうございます", "translation": "Thank you (polite)" },
        { "text": "すみません", "translation": "Excuse me / Sorry" },
        { "text": "いただきます", "translation": "Before eating" },
        { "text": "ごちそうさまでした", "translation": "After eating" },
        { "text": "お元気ですか", "translation": "How are you?" },
        { "text": "はじめまして", "translation": "Nice to meet you" }
      ]
    },
    {
      "id": "minimal-pairs",
      "name": "Pares Mínimos",
      "name_jp": "同音異義語",
      "icon": "🔀",
      "items": [
        { "text": "箸", "translation": "Chopsticks (はし¹)", "pair": "橋" },
        { "text": "橋", "translation": "Bridge (はし²)", "pair": "箸" },
        { "text": "雨", "translation": "Rain (あめ¹)", "pair": "飴" },
        { "text": "飴", "translation": "Candy (あめ⁰)", "pair": "雨" },
        { "text": "柿", "translation": "Persimmon (かき⁰)", "pair": "牡蠣" },
        { "text": "牡蠣", "translation": "Oyster (かき¹)", "pair": "柿" }
      ]
    }
  ]
}
```

---

## Learn Content (Markdown)

### /learn/moras

```markdown
# O que são Moras?

Mora (拍) é a unidade rítmica do japonês - diferente de sílabas!

## Exemplos

| Palavra | Sílabas | Moras |
|---------|---------|-------|
| 東京 (とうきょう) | to-u-kyo-u (4) | と・う・きょ・う (4) |
| 学校 (がっこう) | gak-ko-u (3) | が・っ・こ・う (4) |
| 新聞 (しんぶん) | shin-bun (2) | し・ん・ぶ・ん (4) |

## Regras

1. **Vogal longa** = 2 moras (おう, えい)
2. **っ (sokuon)** = 1 mora
3. **ん (n)** = 1 mora
4. **Combo kana** = 1 mora (きょ, しゃ, etc.)
```

---

## Próximo Passo

Começar pela **Fase 4.1 - Estrutura Base**:

1. Criar layout com navegação
2. Adicionar rotas /learn, /examples
3. Implementar tabs no /app
4. Mover conteúdo atual para tab "Praticar"
