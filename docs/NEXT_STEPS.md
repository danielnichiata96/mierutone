# Mierutone - Product Roadmap

## Visão do Produto

**Problema:** "Estudei japonês por anos mas ainda soo estrangeiro"

**Solução:** Sistema de treino de pronúncia com feedback visual e mensurável

**Diferencial:** Não é dicionário (OJAD). É **ferramenta de treino ativo**.

---

## Como Features Viram SaaS

```
┌─────────────────────────────────────────────────────────────────┐
│                    JORNADA DO USUÁRIO                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DESCOBERTA        2. ENTENDIMENTO       3. PRÁTICA         │
│  ─────────────        ───────────────       ────────           │
│  "Como se fala X?"    "Ah, tem padrão!"     "Deixa eu tentar"  │
│                                                                 │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐       │
│  │ Análise   │   →    │ Mora/Type │   →    │ Record &  │       │
│  │ de Texto  │        │ Breakdown │        │ Compare   │       │
│  └───────────┘        └───────────┘        └───────────┘       │
│       │                     │                    │              │
│       ▼                     ▼                    ▼              │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐       │
│  │ Furigana  │        │ Pitch Viz │        │ Score +   │       │
│  │ + Leitura │        │ + Áudio   │        │ Feedback  │       │
│  └───────────┘        └───────────┘        └───────────┘       │
│                                                  │              │
│                                                  ▼              │
│                              4. PROGRESSO                       │
│                              ───────────                        │
│                              "Estou melhorando!"                │
│                                                                 │
│                              ┌───────────┐                      │
│                              │ Histórico │  ← LOCK-IN          │
│                              │ + Stats   │  ← RETENÇÃO         │
│                              └───────────┘  ← MONETIZAÇÃO      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Plano de Estudo (Produto)

### Estrutura de Aprendizado

```
┌─────────────────────────────────────────────────────────────────┐
│                    PITCH ACCENT MASTERY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NÍVEL 1: Fundamentos                                          │
│  ─────────────────────                                          │
│  □ Entender moras vs sílabas                                   │
│  □ Reconhecer HIGH vs LOW                                      │
│  □ Praticar: Cumprimentos (おはよう, こんにちは)                  │
│                                                                 │
│  NÍVEL 2: Padrões Básicos                                      │
│  ────────────────────────                                       │
│  □ 平板型 (heiban) - Flat pattern                              │
│  □ 頭高型 (atamadaka) - Head-high                              │
│  □ Praticar: Números, dias da semana                           │
│                                                                 │
│  NÍVEL 3: Padrões Avançados                                    │
│  ─────────────────────────                                      │
│  □ 中高型 (nakadaka) - Middle-high                             │
│  □ 尾高型 (odaka) - Tail-high                                  │
│  □ Praticar: Verbos, adjetivos                                 │
│                                                                 │
│  NÍVEL 4: Pares Mínimos                                        │
│  ──────────────────────                                         │
│  □ 箸/橋/端 (hashi variations)                                 │
│  □ 雨/飴 (ame variations)                                      │
│  □ Praticar: Context sentences                                 │
│                                                                 │
│  NÍVEL 5: Fluência                                             │
│  ─────────────────                                              │
│  □ Frases longas com múltiplos padrões                         │
│  □ Velocidade natural                                          │
│  □ Praticar: Diálogos, news                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features por Fase

### ✅ Fase 1 - MVP (Completo)
- [x] Análise de texto → Pitch visualization
- [x] TTS com Azure Speech
- [x] Play button nos cards

### ✅ Fase 2 - Record & Compare (Completo)
- [x] Gravação no browser
- [x] DTW comparison
- [x] Score 0-100

### ✅ Fase 3 - Análise Rica (Completo)

**Objetivo:** Transformar análise simples em ferramenta de estudo

| Feature | Descrição | Tech | Status |
|---------|-----------|------|--------|
| **Mora Breakdown** | と\|う\|きょ\|う (visual) | sudachipy | ✅ Done |
| **Furigana** | 東京(とうきょう) | sudachipy | ✅ Done |
| **Accent Type** | 平板型, 頭高型, etc. | Kanjium DB | ✅ Done |
| **Word Segmentation** | Colorir por palavra | sudachipy | ✅ Done |
| **Part of Speech** | 名詞, 動詞, etc. | sudachipy | ✅ Done |

### ✅ Fase 3.5 - Transparência & Compostos (Completo)

**Objetivo:** Mostrar confiança nos dados e analisar palavras compostas

| Feature | Descrição | Status |
|---------|-----------|--------|
| **Source Types** | dictionary, dictionary_lemma, particle, compound_rule, etc. | ✅ Done |
| **Confidence Levels** | high/medium/low com visual (solid/dashed/dotted) | ✅ Done |
| **UniDic Cross-validation** | Valida accent com segunda fonte | ✅ Done |
| **Word Origin (Goshu)** | 和語, 漢語, 外来語, 固有名詞 | ✅ Done |
| **Compound Analysis** | Detecta componentes via Mode.A split | ✅ Done |
| **McCawley Rules** | Prediz accent de compostos (N2≤2, N2=3-4, N2≥5) | ✅ Done |
| **PhraseFlow** | Visualização de pitch conectado entre palavras | ✅ Done |
| **Riso Palette** | coral (H), cornflower (L), black (neutral) | ✅ Done |

**Endpoint atual:** `POST /api/analyze` retorna:
```json
{
  "text": "東京大学",
  "words": [
    {
      "surface": "東京大学",
      "reading": "とうきょうだいがく",
      "morae": ["と", "う", "きょ", "う", "だ", "い", "が", "く"],
      "accent_type": 5,
      "mora_count": 8,
      "pitch_pattern": ["L", "H", "H", "H", "H", "L", "L", "L"],
      "part_of_speech": "名詞",
      "origin": "kango",
      "origin_jp": "漢語",
      "lemma": "東京大学",
      "source": "dictionary",
      "confidence": "high",
      "warning": null,
      "is_compound": true,
      "components": [
        {"surface": "東京", "reading": "とうきょう", "accent_type": 0, "mora_count": 4, "part_of_speech": "名詞", "reliable": true},
        {"surface": "大学", "reading": "だいがく", "accent_type": 0, "mora_count": 4, "part_of_speech": "名詞", "reliable": true}
      ]
    }
  ]
}
```

### ✅ Fase 4 - Conteúdo Guiado (Completo)

**Objetivo:** Usuário não precisa pensar "o que praticar"

- [x] **Biblioteca de Exemplos** (`/examples`)
  - 8 categorias (Greetings, Minimal Pairs, Numbers, Verbs, Conjugations, Adjectives, Places, Sentences)
  - 80+ exemplos com TTS audio buttons
  - Cards clicáveis que levam ao analyzer

- [x] **Learn Pages** (`/learn`)
  - Página de Moras com exemplos clicáveis
  - Página de Patterns com os 4 tipos explicados
  - Fontes acadêmicas (NHK, Vance, Labrune)
  - Nota sobre dialeto de Tokyo

- [x] **Landing Page**
  - Hero section com CTAs
  - Features section (4 features)
  - Pricing preview (Free tier)
  - Social proof section

- [ ] **Daily Challenge** (Futuro)
  - 5 palavras/dia
  - Streak counter
  - Notificação

### 📋 Fase 5 - Progresso & Monetização

**Objetivo:** Criar valor que justifica pagamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    FREE vs PRO                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FREE                          PRO ($9/mês)                    │
│  ────                          ────────────                     │
│  • 5 análises/dia              • Ilimitado                     │
│  • Sem histórico               • Histórico completo            │
│  • Score básico                • Feedback detalhado            │
│  • Exemplos limitados          • Todos os decks                │
│                                • Export para Anki              │
│                                • Suporte prioritário           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- [ ] **Auth** (Clerk/Supabase)
- [ ] **Histórico de Prática**
  - Scores por palavra
  - Gráfico de evolução
  - Palavras problemáticas
- [ ] **Stripe Integration**
- [ ] **Usage Limits**

---

## Stack Técnica

### Backend (Python/FastAPI)
```
Libs atuais:
├── sudachipy + sudachidict-full (tokenization, Mode C/A)
├── fugashi + unidic (cross-validation, goshu)
├── azure-cognitiveservices-speech (TTS)
├── parselmouth (pitch extraction)
├── fastdtw (comparison)
├── redis (TTS cache)
└── pydantic (validation)

Database:
└── pitch.db (Kanjium 124k+ entries) via mierutone-dictionary

Futuro:
├── pyopenjtalk (phonemes/IPA)
└── cloudflare R2 (cold storage produção)
```

### Frontend (Next.js 14)
```
Atual:
├── React + TypeScript
├── Tailwind CSS (Riso palette)
├── Web Audio API (recording)
└── pitch/ components (shared PitchDot, PitchGlow)

Adicionar:
├── Framer Motion (animações)
├── Clerk (auth)
└── PostHog (analytics)
```

### Infra
```
Backend: Railway ou Render
Frontend: Vercel
Cache: Redis (local) / Upstash (prod)
DB: Supabase (auth + histórico)
Payments: Stripe
Dictionary: GitHub Releases (mierutone-dictionary)
```

---

## Métricas de Sucesso

| Métrica | Target Fase 3.5 | Target Fase 5 |
|---------|-----------------|---------------|
| DAU | 100 | 1,000 |
| Retention D7 | 20% | 40% |
| Conversion Free→Pro | - | 5% |
| MRR | $0 | $2,000 |

---

## Próximo Passo Imediato

**Fase 4 está completa!** Sistema tem:
- Biblioteca de 80+ exemplos em 8 categorias
- Páginas /learn com conteúdo sobre moras e patterns
- Landing page com Features, Pricing, Social Proof
- TTS audio buttons em todos os exemplos
- SEO meta tags em todas as páginas

Próximos passos são **Fase 5 - Auth & Progresso**:

1. **Setup Auth** (Clerk ou Supabase)
   - Login/signup flow
   - Protected routes
   - User profile

2. **Histórico de Prática**
   - Salvar scores por palavra
   - Gráfico de evolução
   - Palavras problemáticas

3. **Monetização** (opcional)
   - Stripe integration
   - Usage limits para free tier

---

## Edge Cases para V2

- Heibanização de nomes próprios em compostos
- Sufixos especiais (~的, ~中, ~性)
- Variação regional de pitch
- Compostos com 3+ componentes (iterative reduction já implementado)
