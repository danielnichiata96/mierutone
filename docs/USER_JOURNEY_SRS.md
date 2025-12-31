# Mierutone - User Journey & Software Requirements

> Documento de evolução do produto: personas, jornadas e requisitos.

---

## 1. Estado Atual (v1.0)

### O que existe hoje

```
┌─────────────────────────────────────────────────────────────────┐
│                        MIERUTONE v1.0                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PÚBLICAS                         PROTEGIDAS                    │
│  ════════                         ══════════                    │
│                                                                 │
│  /              Landing + Analyzer  /dashboard  → Redireciona   │
│                 (mesma página)                    para /        │
│  /learn/*       Conteúdo educativo                              │
│  /examples      Biblioteca                                      │
│  /pricing       Preços                                          │
│                                                                 │
│  FEATURES CORE                                                  │
│  ─────────────                                                  │
│  ✓ Análise de pitch em tempo real                              │
│  ✓ TTS com Azure Neural                                         │
│  ✓ Record & Compare (comparação de pronúncia)                  │
│  ✓ Histórico local (localStorage)                              │
│  ✓ /learn pages (moras, patterns, particles, compounds)        │
│  ✓ Romaji → Hiragana auto-conversion                           │
│                                                                 │
│  O QUE FALTA                                                    │
│  ───────────                                                    │
│  ○ Auth (Supabase ready, não implementado)                     │
│  ○ Dashboard funcional                                          │
│  ○ Histórico persistente                                        │
│  ○ Gamificação / streaks                                        │
│  ○ Practice mode guiado                                         │
│  ○ Export (Anki)                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Personas

### Persona 1: "O Iniciante Curioso" (Hiro)

| Atributo | Descrição |
|----------|-----------|
| **Quem** | Estudante N5-N4, 3-6 meses de estudo |
| **Motivação** | Quer soar "mais japonês", ouviu falar de pitch accent |
| **Comportamento** | Usa Duolingo/Anki, assiste anime, começou a notar "algo diferente" na pronúncia |
| **Dor** | Não sabe o que é pitch accent, recursos parecem complexos |
| **Objetivo** | Entender o básico, testar algumas palavras |
| **Frequência** | Esporádica (1-2x/semana) |
| **Paga?** | Improvável no início, potencial após ver valor |

**Jornada atual:**
```
Google "japanese pitch accent"
    → Encontra OJAD (confuso)
    → Desiste ou encontra Mierutone
    → Testa uma frase
    → "Ah, interessante!"
    → Fecha e esquece
```

**Jornada desejada:**
```
Encontra Mierutone
    → Testa frase
    → Entende visualmente
    → Lê /learn/patterns
    → Volta dia seguinte
    → Cria conta para salvar
    → Recebe email "Pratique hoje"
    → Streak de 7 dias
    → Considera Pro
```

---

### Persona 2: "O Estudante Sério" (Yuki)

| Atributo | Descrição |
|----------|-----------|
| **Quem** | N3-N2, 1-3 anos de estudo, quer fluência |
| **Motivação** | Mora/quer morar no Japão, trabalho ou relacionamento |
| **Comportamento** | Usa Anki diariamente, assiste conteúdo sem legenda, lê NHK |
| **Dor** | Japoneses "entendem mas estranham" sua pronúncia |
| **Objetivo** | Eliminar sotaque estrangeiro, soar natural |
| **Frequência** | Diária (15-30min) |
| **Paga?** | Sim, se o valor for claro (economiza tempo) |

**Jornada atual:**
```
Precisa checar pitch de frase nova
    → Abre Mierutone
    → Analisa
    → Ouve TTS
    → Fecha
    → (Repete processo N vezes sem tracking)
```

**Jornada desejada:**
```
Abre app (logado)
    → Vê "Streak: 14 dias 🔥"
    → Pratica palavras do histórico
    → Analisa frase nova
    → Grava pronúncia
    → Score 87% "Melhoria de 12%!"
    → Exporta para Anki
    → Recebe badge "100 palavras dominadas"
```

---

### Persona 3: "O Professor/Criador" (Kenji)

| Atributo | Descrição |
|----------|-----------|
| **Quem** | Professor de japonês ou YouTuber/criador de conteúdo |
| **Motivação** | Criar material didático de qualidade |
| **Comportamento** | Precisa de visualizações claras para explicar |
| **Dor** | OJAD gera imagens feias, sem customização |
| **Objetivo** | Exportar visuais bonitos, integrar em material |
| **Frequência** | Semanal (criação de conteúdo) |
| **Paga?** | Sim, Pro tier com export e API |

**Jornada desejada:**
```
Prepara aula sobre pitch
    → Abre Mierutone
    → Analisa frases do material
    → Exporta PNG de cada padrão
    → Gera áudio TTS
    → Integra no slide/vídeo
    → Compartilha link com alunos
```

---

## 3. Fases de Evolução

### Fase 1: Foundation (Atual → v1.1)
**Objetivo:** Transformar visitante em usuário recorrente

```
┌─────────────────────────────────────────────────────────────────┐
│                         FASE 1                                  │
│                   "Do Visitante ao Usuário"                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUTH & PERSISTENCE                                             │
│  ──────────────────                                             │
│  [ ] Login com Google/GitHub (Supabase)                        │
│  [ ] Persistir histórico de análises                           │
│  [ ] Sincronizar preferências (voz TTS, tema)                  │
│                                                                 │
│  DASHBOARD FUNCIONAL                                            │
│  ───────────────────                                            │
│  [ ] Estatísticas reais: palavras analisadas, tempo total      │
│  [ ] Histórico com busca/filtro                                │
│  [ ] "Continue de onde parou"                                  │
│                                                                 │
│  RETENTION                                                      │
│  ─────────                                                      │
│  [ ] Email de boas-vindas                                      │
│  [ ] Streak counter (dias consecutivos)                        │
│  [ ] Push notification web (PWA)                               │
│                                                                 │
│  MÉTRICAS ALVO (base: quem fez primeira análise)               │
│  ───────────────────────────────────────────────               │
│  • D1 retention: 30% → 50%                                     │
│  • D7 retention: 10% → 25%                                     │
│  • Signup rate: 5% → 15% (dos que analisaram)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Fase 2: Engagement (v1.2)
**Objetivo:** Criar hábito de uso diário

```
┌─────────────────────────────────────────────────────────────────┐
│                         FASE 2                                  │
│                    "Do Usuário ao Hábito"                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GAMIFICAÇÃO                                                    │
│  ───────────                                                    │
│  [ ] Sistema de XP e níveis                                    │
│  [ ] Achievements (primeira análise, streak 7 dias, etc)       │
│  [ ] Leaderboard opcional                                      │
│  [ ] Daily challenge: "Palavra do dia"                         │
│                                                                 │
│  PRACTICE MODE                                                  │
│  ────────────                                                   │
│  [ ] Flashcards de pitch (visual quiz)                         │
│  [ ] "Ouça e identifique o padrão"                             │
│  [ ] Spaced repetition para palavras erradas                   │
│  [ ] Decks temáticos: cumprimentos, verbos, contadores         │
│                                                                 │
│  PROGRESS TRACKING                                              │
│  ────────────────                                               │
│  [ ] Gráficos de evolução (palavras/semana)                    │
│  [ ] "Palavras problemáticas" (ML simples)                     │
│  [ ] Relatório semanal por email                               │
│                                                                 │
│  MÉTRICAS ALVO                                                  │
│  ─────────────                                                  │
│  • DAU/MAU: 10% → 25%                                          │
│  • Session duration: 3min → 8min                               │
│  • D30 retention: 5% → 15%                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Fase 3: Monetization (v1.3)
**Objetivo:** Converter usuários ativos em pagantes

```
┌─────────────────────────────────────────────────────────────────┐
│                         FASE 3                                  │
│                  "Do Hábito à Conversão"                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FREE TIER (manter generoso para SEO/viral)                    │
│  ─────────────────────────────────────────                     │
│  ✓ Análise ilimitada                                           │
│  ✓ TTS playback (cache + fallback browser)                     │
│  ✓ Histórico (últimos 50)                                      │
│  ✓ /learn content                                              │
│  ○ Record & Compare: 5/dia                                     │
│  ○ Sem export                                                  │
│                                                                 │
│  LIFETIME PRO ($29-49 Single Pay)                              │
│  ─────────────────────────────────                             │
│  [ ] Record & Compare ilimitado                                │
│  [ ] Export Anki (client-side .apkg)                           │
│  [ ] Export PNG/SVG das visualizações                          │
│  [ ] Histórico ilimitado                                       │
│  [ ] Múltiplas vozes TTS (limite diário: 100 req Azure)        │
│  [ ] Early access a novas features                             │
│  [ ] Badge "Lifetime Supporter"                                │
│                                                                 │
│  PAYMENT (Stripe - Single Pay)                                 │
│  ─────────────────────────────                                 │
│  [ ] Stripe Checkout (pagamento único)                         │
│  [ ] Webhook atualiza user.is_lifetime = true                  │
│  [ ] Sem billing portal (não há recorrência)                   │
│  [ ] Cupons de lançamento (50% off primeiros 100)              │
│                                                                 │
│  MÉTRICAS ALVO                                                  │
│  ─────────────                                                  │
│  • Free → Upgrade page: 15%                                    │
│  • Upgrade page → Paid: 5%                                     │
│  • Revenue inicial: $2,000 (primeiros 60 LTD)                  │
│                                                                 │
│  ⚠️  TTS COST MITIGATION                                       │
│  ────────────────────────                                       │
│  1. Cache agressivo: N5-N3 vocab pré-gerado em R2              │
│  2. Browser TTS fallback: window.speechSynthesis               │
│  3. Rate limit: 100 Azure req/dia por Lifetime user            │
│  4. Abuse detection: block bulk generation scripts             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Fase 4: Expansion (v2.0)
**Objetivo:** Novos canais e plataformas

```
┌─────────────────────────────────────────────────────────────────┐
│                         FASE 4                                  │
│                      "Expansão"                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BROWSER EXTENSION                                              │
│  ─────────────────                                              │
│  [ ] Chrome/Firefox extension                                  │
│  [ ] Hover sobre texto japonês → popup com pitch               │
│  [ ] Integração Netflix/Crunchyroll (legendas)                 │
│  [ ] NHK News reader mode                                      │
│                                                                 │
│  MOBILE                                                         │
│  ──────                                                         │
│  [ ] PWA otimizada                                             │
│  [ ] React Native app (ou Flutter)                             │
│  [ ] Offline mode (subset de dados)                            │
│                                                                 │
│  API PÚBLICA                                                    │
│  ───────────                                                    │
│  [ ] API para desenvolvedores                                  │
│  [ ] Documentação                                              │
│  [ ] Rate limiting + billing por uso                           │
│                                                                 │
│  INTEGRAÇÕES                                                    │
│  ───────────                                                    │
│  [ ] Anki add-on oficial                                       │
│  [ ] Obsidian plugin                                           │
│  [ ] Discord bot                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. User Flows Detalhados

### Flow 1: Primeiro Acesso (Visitante → Usuário)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIMEIRO ACESSO                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Landing Page   │
                    │  (valor claro)  │
                    └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  /learn  │   │ Analyzer │   │ Examples │
        │  (SEO)   │   │  (hero)  │   │  (curated)│
        └────┬─────┘   └────┬─────┘   └─────┬────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Primeira Análise│
                    │  "Wow, legal!"  │
                    └────────┬────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌──────────────┐               ┌──────────────┐
      │   Bounce     │               │  Quer mais   │
      │  (maioria)   │               │  (target)    │
      └──────────────┘               └──────┬───────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │  Prompt Signup  │
                                  │ "Salvar histórico│
                                  │  e continuar"   │
                                  └────────┬────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              ▼                           ▼
                      ┌──────────────┐           ┌──────────────┐
                      │  Não agora   │           │   Signup!    │
                      │ (cookie 7d)  │           │  (Supabase)  │
                      └──────────────┘           └──────┬───────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │   Dashboard     │
                                              │  (user home)    │
                                              └─────────────────┘
```

---

### Flow 2: Sessão de Estudo (Usuário Logado)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSÃO DE ESTUDO                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Dashboard     │
                    │  "Streak: 5🔥"  │
                    │  "Continue..."  │
                    └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Continue │   │  Nova    │   │ Practice │
        │ Histórico│   │ Análise  │   │   Mode   │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ WordCard │   │ Analyzer │   │ Flashcard│
        │ Review   │   │ + TTS    │   │  Quiz    │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Record & Comp  │
                    │   (optional)    │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Session End    │
                    │  +15 XP, Badge? │
                    │  "Volte amanhã" │
                    └─────────────────┘
```

---

### Flow 3: Upgrade para Pro

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPGRADE FLOW                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Trigger Event  │
                    │ • 6º Record do dia│
                    │ • Tentar Export │
                    │ • Histórico cheio│
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Soft Paywall  │
                    │ "Limite Free:   │
                    │  5 records/dia" │
                    └────────┬────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌──────────────┐               ┌──────────────┐
      │   Dismiss    │               │  Ver Planos  │
      │ (mostrar 1x) │               │              │
      └──────────────┘               └──────┬───────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │  /pricing       │
                                  │  Free vs Pro    │
                                  │  Comparativo    │
                                  └────────┬────────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │  Start Trial    │
                                  │  (7 dias free)  │
                                  └────────┬────────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │  Stripe Checkout│
                                  │  (cartão agora) │
                                  └────────┬────────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │  Pro Active!    │
                                  │  Confetti 🎉    │
                                  └─────────────────┘
```

---

## 5. Requisitos Funcionais

### RF-1: Autenticação
| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-1.1 | Login com Google OAuth | P0 | 🔲 |
| RF-1.2 | Login com GitHub OAuth | P1 | 🔲 |
| RF-1.3 | Login com Email/Magic Link | P2 | 🔲 |
| RF-1.4 | Logout | P0 | 🔲 |
| RF-1.5 | Sessão persistente (refresh token 30 dias) | P0 | 🔲 |
| RF-1.6 | Migrar localStorage → DB no signup | P1 | 🔲 |

### RF-2: Dashboard
| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-2.1 | Exibir streak atual | P0 | 🔲 |
| RF-2.2 | Estatísticas: palavras analisadas (dia/semana/total) | P0 | 🔲 |
| RF-2.3 | Gráfico de atividade (GitHub-style heatmap) | P2 | 🔲 |
| RF-2.4 | "Continue de onde parou" (última análise) | P1 | 🔲 |
| RF-2.5 | Quick actions: Nova análise, Practice, Examples | P0 | 🔲 |

### RF-3: Histórico
| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-3.1 | Listar análises passadas (paginado) | P0 | 🔲 |
| RF-3.2 | Busca por texto/palavra | P1 | 🔲 |
| RF-3.3 | Filtro por data | P2 | 🔲 |
| RF-3.4 | Deletar item do histórico | P1 | 🔲 |
| RF-3.5 | Re-analisar item salvo | P0 | 🔲 |
| RF-3.6 | Limite: 50 (Free) / Ilimitado (Pro) | P1 | 🔲 |

### RF-4: Gamificação
| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-4.1 | Sistema de XP (análise=5xp, record=10xp) | P1 | 🔲 |
| RF-4.2 | Níveis (1-50) baseados em XP | P2 | 🔲 |
| RF-4.3 | Achievements (lista definida) | P1 | 🔲 |
| RF-4.4 | Streak tracking (dias consecutivos) | P0 | 🔲 |
| RF-4.5 | Toast notification para achievements | P1 | 🔲 |

### RF-5: Practice Mode
| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-5.1 | Flashcard: mostrar palavra, user identifica padrão | P1 | 🔲 |
| RF-5.2 | Audio quiz: ouvir TTS, identificar pitch | P2 | 🔲 |
| RF-5.3 | Spaced repetition para erros | P2 | 🔲 |
| RF-5.4 | Decks temáticos pré-definidos | P1 | 🔲 |
| RF-5.5 | Daily challenge (1 palavra nova/dia) | P2 | 🔲 |

### RF-6: Export (Lifetime Pro - Client-Side)
| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-6.1 | Export Anki (.apkg) - client-side com sql.js + jszip | P1 | 🔲 |
| RF-6.2 | Export CSV do histórico - client-side | P2 | 🔲 |
| RF-6.3 | Export PNG da visualização - html2canvas | P1 | 🔲 |
| RF-6.4 | Export SVG (vetorial) - DOM serialize | P2 | 🔲 |

> **Nota técnica:** Todos exports são client-side para manter arquitetura serverless/barata.
> Anki .apkg = SQLite DB + media files em ZIP. Usar sql.js para gerar no browser.

### RF-7: Billing (Single Pay / LTD)
| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-7.1 | Stripe Checkout (payment_mode: 'payment') | P1 | 🔲 |
| RF-7.2 | Webhook checkout.session.completed → user.is_lifetime = true | P1 | 🔲 |
| RF-7.3 | Cupons de lançamento (LAUNCH50) | P2 | 🔲 |
| RF-7.4 | Página /pricing com comparativo Free vs Lifetime | P1 | 🔲 |

> **Sem billing portal:** Não há subscription para gerenciar. Lifetime = forever.

---

## 6. Requisitos Não-Funcionais

### RNF-1: Performance
| ID | Requisito | Target |
|----|-----------|--------|
| RNF-1.1 | Tempo de análise < 500ms (p95) | < 500ms |
| RNF-1.2 | LCP (Largest Contentful Paint) | < 2.5s |
| RNF-1.3 | TTS latency (first byte) | < 1s |
| RNF-1.4 | Dashboard load time | < 1s |

### RNF-2: Escalabilidade
| ID | Requisito | Target |
|----|-----------|--------|
| RNF-2.1 | Concurrent users | 1000 |
| RNF-2.2 | Database queries (p95) | < 100ms |
| RNF-2.3 | TTS cache hit rate | > 90% |
| RNF-2.4 | TTS Azure requests/user/day (Lifetime) | ≤ 100 |
| RNF-2.5 | Browser TTS fallback disponível | Required |

> **TTS Cost Strategy (crítico para LTD):**
> - Pré-gerar N5-N3 vocab (~3000 palavras) em R2
> - Cache frases comuns (examples, learn content)
> - Fallback: window.speechSynthesis (grátis, qualidade ok)
> - Rate limit: 100 Azure/dia para Lifetime users
> - Abuse detection: block se > 500 chars/request ou > 50 req/hora

### RNF-3: Segurança
| ID | Requisito | Target |
|----|-----------|--------|
| RNF-3.1 | HTTPS everywhere | Required |
| RNF-3.2 | JWT access token expiry | 1 hour |
| RNF-3.3 | Refresh token expiry (sessão) | 30 dias |
| RNF-3.4 | Rate limiting API | 100/min |
| RNF-3.5 | Input sanitization | Required |
| RNF-3.6 | GDPR compliance (delete data) | Required |

### RNF-4: Disponibilidade
| ID | Requisito | Target |
|----|-----------|--------|
| RNF-4.1 | Uptime | 99.5% |
| RNF-4.2 | Backup frequency | Daily |
| RNF-4.3 | Recovery time | < 1h |

---

## 7. Métricas de Sucesso

### North Star Metric
**Weekly Active Learners (WAL)**: Usuários únicos que completaram ≥3 sessões na semana

### Funil de Conversão (LTD Model)
```
Visitantes     → Primeira Análise    (60%)
Primeira       → Signup              (15%)
Signup         → D1 Return           (50%)
D1             → D7 Active           (25%)
D7             → D30 Active          (40%)
D30 Active     → Ver /pricing        (20%)
/pricing       → Lifetime Purchase   (5%)
```

> **Conversão final:** ~0.09% visitantes → paid
> **Break-even:** 60 LTDs × $35 avg = $2,100

### KPIs por Fase

| Fase | KPI Principal | Target |
|------|---------------|--------|
| 1 - Foundation | D7 Retention | 25% |
| 2 - Engagement | DAU/MAU | 25% |
| 3 - Monetization | Lifetime Sales | 100 LTDs |
| 4 - Expansion | Platform reach | 3+ canais |

---

## 8. Próximos Passos Imediatos

### Sprint 1 (2 semanas): Auth + Dashboard Base
```
[ ] Supabase Auth setup (Google OAuth - P0)
[ ] GitHub OAuth (P1, pode ser Sprint 2)
[ ] Middleware de proteção de rotas
[ ] Dashboard layout básico
[ ] Histórico persistente (DB)
[ ] Streak counter funcional
```

### Sprint 2 (2 semanas): Engagement Básico
```
[ ] Sistema de XP
[ ] 5 achievements iniciais
[ ] Email de boas-vindas (Resend)
[ ] "Continue de onde parou"
```

### Sprint 3 (2 semanas): Lifetime + Limites
```
[ ] Stripe Checkout (single payment)
[ ] Webhook → user.is_lifetime = true
[ ] Free vs Lifetime limits (R&C, export, histórico)
[ ] /pricing page com comparativo
[ ] Cupom LAUNCH50
```

---

## 9. Integrações Futuras

### Prioridade Alta (Fase 4)

| Integração | Descrição | Valor | Complexidade |
|------------|-----------|-------|--------------|
| **Chrome Extension** | Hover sobre texto JP → popup com pitch | Maior alcance, "vive onde usuário está" | Média |
| **Anki Export** | Gerar .apkg com cards visuais + áudio | Altíssimo para estudantes sérios | Média |
| **WaniKani Sync** | Importar vocab aprendido, mostrar pitch | Comunidade engajada, cross-sell | Média |

### Prioridade Média

| Integração | Descrição | Valor | Complexidade |
|------------|-----------|-------|--------------|
| **Discord Bot** | /pitch 東京 → retorna imagem + áudio | Comunidades JP no Discord | Baixa |
| **Obsidian Plugin** | Render pitch inline em notes | PKM users, japonês + Obsidian | Média |
| **Netflix/Crunchyroll** | Pitch overlay em legendas | Viral, diferencial único | Alta |

### Prioridade Baixa (Exploratório)

| Integração | Descrição | Valor | Complexidade |
|------------|-----------|-------|--------------|
| **Bunpro Sync** | Gramática + pitch juntos | Nicho, parceria necessária | Alta |
| **Todai Reader** | Pitch em artigos NHK | Complementar, não competir | Média |
| **API Pública** | Devs criam suas integrações | Ecossistema, monetização | Alta |

### Chrome Extension - Detalhamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHROME EXTENSION MVP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FASE 1: Popup básico                                          │
│  ─────────────────────                                          │
│  [ ] Selecionar texto → botão direito → "Ver pitch"            │
│  [ ] Popup com WordCards                                       │
│  [ ] TTS playback                                              │
│  [ ] Link para app completo                                    │
│                                                                 │
│  FASE 2: Hover mode                                            │
│  ─────────────────                                              │
│  [ ] Toggle: ativar/desativar hover                            │
│  [ ] Hover sobre palavra → mini tooltip com pitch              │
│  [ ] Settings: delay, tamanho, posição                         │
│                                                                 │
│  FASE 3: Reader mode                                           │
│  ─────────────────                                              │
│  [ ] Ativar em página inteira                                  │
│  [ ] Underline colorido (H/L) em todo texto JP                 │
│  [ ] Sidebar com lista de palavras                             │
│                                                                 │
│  FASE 4: Netflix/Crunchyroll                                   │
│  ──────────────────────────                                     │
│  [ ] Detectar legendas                                         │
│  [ ] Overlay de pitch sincronizado                             │
│  [ ] Pausar para ver detalhes                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### WaniKani Integration - Detalhamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    WANIKANI INTEGRATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OBJETIVO                                                       │
│  ────────                                                       │
│  Usuários WaniKani já estão aprendendo vocab.                  │
│  Mierutone adiciona a camada de pitch que WK não tem.          │
│                                                                 │
│  FEATURES                                                       │
│  ────────                                                       │
│  [ ] OAuth com WaniKani API                                    │
│  [ ] Importar vocab por nível (1-60)                           │
│  [ ] Dashboard: "Seu progresso WK + Pitch"                     │
│  [ ] Practice mode com vocab do WK                             │
│  [ ] Badge: "WK Level 10 + Pitch Master"                       │
│                                                                 │
│  API WANIKANI                                                   │
│  ─────────────                                                  │
│  GET /subjects?types=vocabulary                                │
│  → Retorna vocab com readings                                  │
│  → Mierutone adiciona pitch pattern                            │
│                                                                 │
│  MONETIZAÇÃO                                                    │
│  ───────────                                                    │
│  Free: Sync níveis 1-10                                        │
│  Pro: Sync todos os níveis + practice personalizado            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Documento vivo - atualizar conforme evolução do produto.*
