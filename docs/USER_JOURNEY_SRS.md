# Mierutone - User Journey & Software Requirements

> **Versão 2.0** - Modelo centrado em aprendizado, não em análises.

---

## 1. Modelo de Produto

### Antes vs Depois

```
MODELO ANTIGO (Ferramenta)          MODELO NOVO (Aprendizado)
═══════════════════════════         ═══════════════════════════

Analyzer = Produto                  Jornada = Produto
Decks = Feature opcional            Analyzer = Ferramenta de apoio
Valor = "análises ilimitadas"       Valor = "dominar pitch accent"

Problema: Por que pagar?            Solução: Pago pelo progresso
```

### Proposta de Valor

| Aspecto | Grátis | Pro (Assinatura) |
|---------|--------|------------------|
| **Analyzer** | 5 análises/dia | Ilimitado |
| **Decks** | 2 introdutórios | Biblioteca completa |
| **Progresso** | Preview | Tracking completo |
| **Prática** | Quiz básico | Shadowing, SRS, feedback |
| **Mastery** | - | Certificados de domínio |

---

## 2. Jornada de Aprendizado

### Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    JORNADA DE PITCH ACCENT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FASE 1: FUNDAÇÃO (Grátis)                                     │
│  ─────────────────────────                                      │
│  Semana 1-2: O que é pitch accent?                             │
│  • Conceito H/L (alto/baixo)                                   │
│  • Os 4 padrões básicos (平板/頭高/中高/尾高)                    │
│  • Minimal pairs (箸/橋, 雨/飴)                                 │
│  • Quiz: Identifique o padrão                                  │
│  → Deck "Primeiros Passos" (30 palavras)                       │
│                                                                 │
│  FASE 2: VOCABULÁRIO CORE (Grátis → Pro)                       │
│  ────────────────────────────────────────                       │
│  Semana 3-6: Palavras essenciais                               │
│  • Números e contadores                                        │
│  • Dias, meses, tempo                                          │
│  • Cumprimentos e expressões                                   │
│  • Verbos básicos (て-form, ます-form)                          │
│  → Deck "N5 Essencial" (200 palavras)                          │
│  → Deck "Verbos Básicos" (100 palavras)                        │
│                                                                 │
│  FASE 3: PARTÍCULAS E COMPOSTOS (Pro)                          │
│  ─────────────────────────────────────                          │
│  Semana 7-10: Como pitch flui na frase                         │
│  • Partículas (は, が, を, に, で, と)                          │
│  • Compostos e regras McCawley                                 │
│  • Pitch em verbos conjugados                                  │
│  → Deck "Partículas" (50 padrões)                              │
│  → Deck "Compostos" (150 palavras)                             │
│                                                                 │
│  FASE 4: FLUÊNCIA (Pro)                                        │
│  ──────────────────────                                         │
│  Semana 11+: Produção ativa                                    │
│  • Shadowing com TTS                                           │
│  • Record & Compare                                            │
│  • Frases completas                                            │
│  • Conteúdo real (anime, drama, NHK)                           │
│  → Deck "Frases Naturais" (200 frases)                         │
│  → Deck temáticos (Anime, Negócios, etc.)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Progressão do Usuário

```
Visitante → Estudante → Praticante → Fluente
    │           │            │           │
    ▼           ▼            ▼           ▼
 Landing    Fase 1-2      Fase 3-4    Domínio
 (grátis)   (grátis)      (Pro)       (Pro)
    │           │            │           │
    └─── Soft-lock ──► Signup ──► Assinatura
         (após Fase 1)
```

---

## 3. Estrutura de Decks

### Deck = Unidade de Aprendizado

Cada deck contém:
- **Palavras/Frases** com pitch pattern
- **Áudio TTS** nativo
- **Quiz** de identificação (ouvir → escolher padrão)
- **Shadowing** (ouvir → repetir → comparar)
- **SRS** (espaçamento para palavras difíceis)

### Biblioteca de Decks

| Deck | Palavras | Nível | Acesso |
|------|----------|-------|--------|
| Primeiros Passos | 30 | Iniciante | Grátis |
| Minimal Pairs | 50 | Iniciante | Grátis |
| N5 Essencial | 200 | Iniciante | Pro |
| N4 Vocabulário | 300 | Intermediário | Pro |
| Verbos (て/ます) | 100 | Iniciante | Pro |
| Partículas | 50 | Intermediário | Pro |
| Compostos | 150 | Intermediário | Pro |
| Cumprimentos | 80 | Iniciante | Pro |
| Números/Contadores | 100 | Iniciante | Pro |
| Frases Naturais | 200 | Avançado | Pro |
| Anime Popular | 150 | Intermediário | Pro |
| Business Japanese | 100 | Avançado | Pro |

**Total:** ~1500 itens de estudo

### Formato de Card (Deck Item)

```
┌─────────────────────────────────────┐
│  橋  (はし)                         │
│  ─────────────────                  │
│  Padrão: 頭高型 (2)                 │
│                                     │
│  [H─L]  は↘し                       │
│   ●━━●                              │
│                                     │
│  🔊 Ouvir    🎤 Gravar    ➡️ Próximo │
└─────────────────────────────────────┘
```

---

## 4. Tipos de Prática

### 4.1 Quiz de Identificação

```
🔊 [Áudio toca: "はし"]

Qual é o padrão?

[ ] 平板 (LHHH...)    [ ] 頭高 (HLLL...)
[●] 中高 (LHHL...)    [ ] 尾高 (LHHH↘)

✅ Correto! Este é 橋 (ponte) - padrão 頭高
   Compare com 箸 (hashi) que é 平板
```

### 4.2 Shadowing

```
┌─────────────────────────────────────┐
│  "東京に行きたい"                    │
│                                     │
│  1. 🔊 Ouça o nativo                │
│     [████████████] 2.3s             │
│                                     │
│  2. 🎤 Repita                       │
│     [████████░░░░] 1.8s             │
│                                     │
│  3. 📊 Comparação                   │
│     Timing: 78%                     │
│     Pitch: 85%                      │
│     Overall: 82% ⭐⭐⭐⭐             │
│                                     │
│  [Tentar novamente] [Próximo]       │
└─────────────────────────────────────┘
```

### 4.3 SRS (Spaced Repetition)

- Palavras erradas aparecem mais frequentemente
- Palavras dominadas espaçam (1d → 3d → 7d → 14d → 30d)
- Score de "domínio" por palavra
- Dashboard mostra palavras para revisar hoje

---

## 5. Monetização

### Modelo: Freemium → Assinatura

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRICING                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GRÁTIS                           PRO ($9/mês ou $69/ano)      │
│  ══════                           ═══════════════════════       │
│                                                                 │
│  ✓ Analyzer (5/dia)               ✓ Analyzer ilimitado         │
│  ✓ 2 decks introdutórios          ✓ Biblioteca completa        │
│  ✓ Quiz básico                    ✓ Todos os modos de prática  │
│  ✓ Preview de progresso           ✓ Tracking completo          │
│  ✗ Shadowing limitado             ✓ Shadowing ilimitado        │
│  ✗ SRS                            ✓ SRS personalizado          │
│  ✗ Certificados                   ✓ Certificados de domínio    │
│  ✗ Decks temáticos                ✓ Todos os decks             │
│                                                                 │
│  LIFETIME ($149 - Lançamento)                                  │
│  ═════════════════════════════                                  │
│  ✓ Tudo do Pro, para sempre                                    │
│  ✓ Acesso a decks futuros                                      │
│  ✓ Badge "Early Supporter"                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Gatilhos de Conversão

| Momento | Gatilho | Mensagem |
|---------|---------|----------|
| Fase 1 completa | Soft paywall | "Você dominou os básicos! Continue sua jornada." |
| 5ª análise/dia | Limit hit | "Quer analisar mais? Upgrade para Pro." |
| Deck Pro clicado | Preview lock | "Este deck é Pro. Veja o que você vai aprender..." |
| Shadowing #6 | Feature lock | "Shadowing ilimitado no Pro." |
| 7 dias de uso | Retention offer | "Você está consistente! 50% off no primeiro mês." |

---

## 6. User Flows

### Flow 1: Novo Usuário (Grátis → Pro)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING JOURNEY                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Landing       │
                    │  "Aprenda       │
                    │  pitch accent"  │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Começar Grátis │
                    │  (sem signup)   │
                    └────────┬────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │         FASE 1                │
              │  • O que é pitch?             │
              │  • 4 padrões básicos          │
              │  • Deck "Primeiros Passos"    │
              │  • Quiz introdutório          │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  "Fase 1 completa!│
                    │   Salve seu      │
                    │   progresso"     │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Magic Link     │
                    │  (email only)   │
                    └────────┬────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │         FASE 2                │
              │  • Vocabulário N5             │
              │  • Deck "N5 Essencial"        │
              │  • Mais quizzes               │
              │  • Preview de shadowing       │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  "Quer continuar │
                    │   sua jornada?"  │
                    │                  │
                    │  [Ver Pro →]     │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Checkout       │
                    │  (Stripe)       │
                    └────────┬────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Pro Ativo!     │
                    │  Jornada        │
                    │  completa       │
                    └─────────────────┘
```

### Flow 2: Sessão de Estudo (Pro)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSÃO DIÁRIA                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Dashboard     │
                    │  "Streak: 14🔥" │
                    │  "12 para       │
                    │   revisar hoje" │
                    └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Revisar  │   │ Continuar│   │ Analisar │
        │ (SRS)    │   │ Deck     │   │ Texto    │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Quiz +   │   │ Novos    │   │ Analyzer │
        │ Shadowing│   │ cards    │   │ (apoio)  │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Sessão fim     │
                    │  "+25 palavras" │
                    │  "Volte amanhã" │
                    └─────────────────┘
```

---

## 7. Requisitos Funcionais

### RF-1: Jornada de Aprendizado

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-1.1 | Fases de aprendizado (1-4) com progressão | P0 | 🔲 |
| RF-1.2 | Onboarding guiado (Fase 1 sem signup) | P0 | 🔲 |
| RF-1.3 | Progresso salvo por fase/deck | P0 | 🔲 |
| RF-1.4 | "Continue de onde parou" | P0 | 🔲 |
| RF-1.5 | Certificados de conclusão por fase | P2 | 🔲 |

### RF-2: Sistema de Decks

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-2.1 | Biblioteca de decks com categorias | P0 | 🔲 |
| RF-2.2 | Card view (palavra, padrão, áudio) | P0 | 🔲 |
| RF-2.3 | Navegação entre cards (swipe/arrows) | P0 | 🔲 |
| RF-2.4 | Progresso por deck (X/Y completados) | P0 | 🔲 |
| RF-2.5 | Lock/unlock baseado em tier (Free/Pro) | P1 | 🔲 |
| RF-2.6 | Preview de decks Pro (3 cards grátis) | P1 | 🔲 |

### RF-3: Quiz e Prática

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-3.1 | Quiz: ouvir áudio → escolher padrão | P0 | 🔲 |
| RF-3.2 | Quiz: ver palavra → escolher padrão | P0 | 🔲 |
| RF-3.3 | Feedback imediato (correto/errado + explicação) | P0 | 🔲 |
| RF-3.4 | Score por sessão de quiz | P1 | 🔲 |
| RF-3.5 | Shadowing: play → record → compare | P1 | 🔲 |
| RF-3.6 | Shadowing: score de similaridade | P1 | 🔲 |

### RF-4: SRS (Spaced Repetition)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-4.1 | Tracking de acerto/erro por card | P1 | 🔲 |
| RF-4.2 | Algoritmo de espaçamento (SM-2 ou similar) | P1 | 🔲 |
| RF-4.3 | "Revisar hoje" com cards pendentes | P1 | 🔲 |
| RF-4.4 | Domínio por palavra (0-100%) | P2 | 🔲 |

### RF-5: Dashboard de Progresso

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-5.1 | Streak atual e melhor | P0 | ✅ |
| RF-5.2 | Palavras aprendidas (total, hoje, semana) | P0 | ✅ |
| RF-5.3 | Fase atual e % conclusão | P0 | 🔲 |
| RF-5.4 | Cards para revisar hoje | P1 | 🔲 |
| RF-5.5 | Gráfico de atividade (heatmap) | P2 | 🔲 |

### RF-6: Analyzer (Ferramenta de Apoio)

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-6.1 | Análise de texto livre | P0 | ✅ |
| RF-6.2 | Limite diário (5 Free, ilimitado Pro) | P1 | 🔲 |
| RF-6.3 | "Adicionar ao meu deck" (salvar palavra) | P1 | 🔲 |
| RF-6.4 | TTS playback | P0 | ✅ |
| RF-6.5 | Record & Compare | P0 | ✅ |

### RF-7: Autenticação e Billing

| ID | Requisito | Prioridade | Status |
|----|-----------|------------|--------|
| RF-7.1 | Magic Link (email only) | P0 | 🔲 |
| RF-7.2 | Google OAuth (alternativa) | P1 | 🔲 |
| RF-7.3 | Soft-lock após Fase 1 completa | P0 | 🔲 |
| RF-7.4 | Stripe subscription (mensal/anual) | P0 | 🔲 |
| RF-7.5 | Stripe one-time (Lifetime) | P1 | 🔲 |
| RF-7.6 | Webhook → user.subscription_tier | P0 | 🔲 |

---

## 8. Métricas de Sucesso

### North Star Metric
**Weekly Active Learners (WAL)**: Usuários que completaram ≥1 sessão de estudo (deck/quiz) na semana

### Funil de Conversão

```
Visitantes     → Começar Fase 1      (40%)
Fase 1         → Completar Fase 1    (60%)
Completar      → Signup (Magic Link) (70%)
Signup         → Iniciar Fase 2      (80%)
Fase 2         → Ver página Pro      (30%)
Ver Pro        → Assinar             (15%)
```

**Conversão final:** ~1.0% visitantes → paid (vs 0.09% modelo antigo)

### KPIs por Fase

| Fase | KPI Principal | Target |
|------|---------------|--------|
| Onboarding | Fase 1 completion rate | 60% |
| Retention | D7 return rate | 40% |
| Engagement | Cards/semana (Pro) | 100 |
| Revenue | MRR | $5,000 |

---

## 9. Roadmap

### Sprint 1 (2 semanas): Fundação de Decks

```
[ ] Estrutura de dados: Deck, Card, UserProgress
[ ] UI: Biblioteca de decks
[ ] UI: Card view com navegação
[ ] 2 decks iniciais (Primeiros Passos, Minimal Pairs)
[ ] Quiz básico (identificar padrão)
```

### Sprint 2 (2 semanas): Jornada + Auth

```
[ ] Fases de aprendizado (1-4)
[ ] Onboarding guiado (Fase 1)
[ ] Magic Link auth
[ ] Soft-lock após Fase 1
[ ] Progresso persistente
```

### Sprint 3 (2 semanas): Prática Avançada

```
[ ] Shadowing (play → record → compare)
[ ] SRS básico (tracking de acertos)
[ ] Dashboard de progresso
[ ] Mais 3 decks (N5, Verbos, Cumprimentos)
```

### Sprint 4 (2 semanas): Monetização

```
[ ] Stripe subscription
[ ] Tier gating (Free vs Pro)
[ ] Limites de uso (analyzer, shadowing)
[ ] Página /pricing
[ ] Lifetime option
```

---

## 10. Conteúdo dos Decks (MVP)

### Deck 1: Primeiros Passos (30 palavras) - GRÁTIS

Objetivo: Entender os 4 padrões básicos

| Palavra | Reading | Padrão | Tipo |
|---------|---------|--------|------|
| 箸 | はし | 頭高 [1] | 名詞 |
| 橋 | はし | 平板 [0] | 名詞 |
| 雨 | あめ | 頭高 [1] | 名詞 |
| 飴 | あめ | 平板 [0] | 名詞 |
| 日本 | にほん | 中高 [2] | 名詞 |
| 東京 | とうきょう | 中高 [0] | 名詞 |
| ... (24 mais) |

### Deck 2: Minimal Pairs (50 palavras) - GRÁTIS

Objetivo: Distinguir palavras que só diferem no pitch

| Par | Padrão A | Padrão B |
|-----|----------|----------|
| 箸/橋 | 頭高 | 平板 |
| 雨/飴 | 頭高 | 平板 |
| 柿/牡蠣 | 平板 | 頭高 |
| 酒/鮭 | 平板 | 頭高 |
| ... |

### Deck 3: N5 Essencial (200 palavras) - PRO

Objetivo: Vocabulário básico com pitch correto

Categorias: Números, Tempo, Família, Casa, Comida, Verbos básicos

---

*Documento vivo - atualizar conforme evolução do produto.*
