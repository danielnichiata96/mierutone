# PitchLab JP - Product Vision

> O "Grammarly da Pronúncia Japonesa"

---

## Conceito Central

Assim como ninguém envia um e-mail importante sem passar pelo Grammarly, **ninguém que estuda japonês sério falará uma frase nova sem "passar o PitchLab JP"**.

- Não ensina *o que* dizer (Duolingo faz isso)
- Ensina a **não soar como um robô ou estrangeiro confuso**

---

## O Problema

O **OJAD (Online Japanese Accent Dictionary)** é a bíblia dos estudantes sérios, mas:
- Interface datada e punitiva
- Gera PDFs/imagens estáticas
- Sem áudio fluido
- Zero feedback de pronúncia

---

## A Solução

### Fluxo Principal (Web App)

```
┌─────────────────────────────────────────────────────────────┐
│  INPUT: 昨日は肉を食べました                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    き  の  う  は  に  く  を  た  べ  ま  し  た            │
│    ─┐  │   │      ─┐  │      ─┐  │   │   │   │            │
│     └──┴───┘       └──┘       └──┴───┴───┴───┘            │
│    [HEIBAN]      [ATAMADAKA]     [NAKADAKA]                │
│                                                             │
│    🔊 Play Native    🎤 Record Yourself    📊 Compare       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

1. **Input**: Usuário cola frase em japonês
2. **Processamento**: Análise morfológica identifica pitch de cada palavra
3. **Visual**: Gráfico "escadinha" dinâmico sobre kana/kanji
4. **TTS**: Áudio cristalino via Azure/ElevenLabs
5. **Record & Compare**: Usuário grava e vê onda sobreposta

---

## Produtos

### 1. Web App - O Hub de Estudo
- Dicionário moderno (substituto do OJAD)
- Editor de frases com visualização pitch em tempo real
- Mudou partícula? Gráfico atualiza instantaneamente

### 2. Extensão de Browser - O "Cadeado" no Usuário
O produto **vive onde o usuário já está**:

| Contexto | Funcionalidade |
|----------|----------------|
| Crunchyroll/Netflix | Gráfico de pitch da legenda em tempo real |
| NHK News | "Escadinha" sobre cada parágrafo |
| Anki | Gera áudio + imagem do gráfico automaticamente |
| Qualquer site | Seleciona texto → botão direito → Mini-PitchLab JP |

### 3. Record & Compare - O "Guitar Hero" da Fluência
- Usuário vê a "estrada" (pitch do nativo)
- "Dirige" a própria voz por cima
- Sistema dá **Score de Melodia**
- Não é sobre acertar palavras, é sobre **acertar a música da frase**

---

## Stack Técnica

### Backend (Python/FastAPI)

```
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /analyze                                              │
│  ├── fugashi + unidic → tokenização                        │
│  ├── aType field → posição do acento                       │
│  └── retorna: [{word, reading, pitch_pattern, mora_count}] │
│                                                             │
│  POST /tts                                                  │
│  ├── Azure AI Speech (ou ElevenLabs)                       │
│  └── retorna: audio/wav                                    │
│                                                             │
│  POST /compare (v2)                                         │
│  ├── Parselmouth/Librosa → análise de pitch                │
│  └── retorna: similarity_score, alignment_data             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bibliotecas Core

| Lib | Função | Install |
|-----|--------|---------|
| **fugashi** | Wrapper MeCab (tokenização) | `pip install 'fugashi[unidic]'` |
| **unidic** | Dicionário com pitch accent (aType) | `python -m unidic download` |
| **tdmelodic** | Infere pitch de neologismos (neural) | `pip install tdmelodic` |
| **Parselmouth** | Análise de pitch (motor Praat) | `pip install praat-parselmouth` |
| **Librosa** | Processamento de áudio | `pip install librosa` |

### Pitch Accent - Como Funciona

```python
from fugashi import Tagger

tagger = Tagger()
for word in tagger("橋を渡る"):
    # aType = número da mora onde o tom CAI
    # 0 = Heiban (平板) - tom sobe e fica alto
    # 1 = Atamadaka (頭高) - começa alto, cai na 2ª mora
    # 2 = Nakadaka (中高) - cai na 2ª mora
    # N = Odaka (尾高) - cai após última mora
    print(f"{word.surface}: aType={word.feature.aType}")
```

### Frontend

**MVP**: Streamlit (100% Python, rápido para validar)
**Produção**: Next.js chamando API Python

### TTS Comparison

| Provider | Vozes JP | Preço | Latência | Free Tier |
|----------|----------|-------|----------|-----------|
| Azure AI Speech | ~10 neurais | ~$4/1M chars* | ~200ms | 500K/mês |
| ElevenLabs | ~3-5 | ~$5/100K chars | ~400ms | 10K/mês |

*Kanji conta como 2 caracteres no Azure

**Recomendação**: Azure para produção, ElevenLabs para prototipagem.

---

## Modelo de Negócio

### Plano Gratuito
- Dicionário web (OJAD moderno)
- X consultas/dia
- Sem histórico

### Plano Pro ($9-15/mês)
- Extensão ilimitada
- Integração Anki (export 1-clique)
- Histórico de pronúncia
- IA: "Você está melhorando no padrão Nakadaka!"
- TTS alta fidelidade

### Plano Enterprise (Escolas)
- Painel para professores
- Tracking de evolução dos alunos
- API dedicada
- Relatórios de progresso

---

## Vantagem Competitiva (Moat)

1. **Complexidade Técnica**
   - Mapear UniDic + MeCab + SVG dinâmico é trabalhoso
   - Uma vez feito bem, você domina o nicho

2. **Custo de Escala Baixo**
   - Processamento é leve (texto → JSON)
   - TTS é pay-per-use
   - Sem GPU necessário

3. **Lock-in Natural**
   - Extensão vive no browser do usuário
   - Histórico de pronúncia cria valor acumulado
   - Integração Anki = dependência

4. **Nicho Específico**
   - Estudantes sérios de japonês
   - Executivos/diplomatas
   - Acadêmicos
   - Fãs dedicados (anime/manga)

---

## Diferenciais vs. OJAD

| OJAD | PitchLab JP |
|------|------|
| PDF/imagem estática | Gráfico dinâmico interativo |
| Sem áudio | TTS neural de alta qualidade |
| Sem feedback | Record & Compare com score |
| Interface datada | UI moderna e limpa |
| Só web | Web + Extensão + Anki |

---

## Roadmap

### Fase 1 - MVP (Core)
- [ ] Backend FastAPI com `/analyze`
- [ ] Integração fugashi + unidic
- [ ] Frontend básico (Streamlit ou React)
- [ ] Visualização pitch simples

### Fase 2 - TTS
- [ ] Integração Azure AI Speech
- [ ] Endpoint `/tts`
- [ ] Player de áudio no frontend

### Fase 3 - Record & Compare
- [ ] Gravação de áudio no browser
- [ ] Análise com Parselmouth
- [ ] Visualização de comparação
- [ ] Score de similaridade

### Fase 4 - Extensão
- [ ] Chrome extension MVP
- [ ] Context menu "Analyze with PitchLab JP"
- [ ] Overlay de pitch em páginas

### Fase 5 - Anki
- [ ] Export de cards
- [ ] Imagem SVG do gráfico
- [ ] Áudio TTS incluso

### Fase 6 - Pro Features
- [ ] Histórico de prática
- [ ] Analytics de progresso
- [ ] Sistema de pagamento

---

---

## Personas

### Persona 1: "O Autodidata Sério" (Maria, 28 anos)
- **Contexto**: Estuda japonês há 3 anos, usa Anki diariamente, assiste anime sem legenda
- **Dores**: Frustração ao falar e ser mal compreendida, falta de feedback objetivo
- **Necessidades**: Ferramenta que se integre ao fluxo existente (Anki, Netflix), feedback claro
- **Uso**: Extensão no browser + export para Anki

### Persona 2: "O Executivo" (Carlos, 42 anos)
- **Contexto**: Trabalha em empresa japonesa, precisa falar em reuniões, tempo limitado
- **Dores**: Pronúncia errada causa mal-entendidos profissionais, não tem tempo para estudar
- **Necessidades**: Ferramenta rápida, focada em frases de negócio, feedback imediato
- **Uso**: Web app para preparar apresentações, extensão para emails

### Persona 3: "O Acadêmico" (Ana, 31 anos)
- **Contexto**: PhD em estudos japoneses, pesquisa linguística, precisa de precisão técnica
- **Dores**: OJAD é limitado, precisa de dados para análise, quer entender padrões
- **Necessidades**: API para análise em massa, dados exportáveis, precisão científica
- **Uso**: API + web app para análise de corpus

### Persona 4: "O Fã Dedicado" (João, 24 anos)
- **Contexto**: Ama anime/manga, quer entender diálogos, sonha em visitar Japão
- **Dores**: Pronúncia soa "estrangeira", quer soar mais natural
- **Necessidades**: Gamificação, feedback visual claro, integração com conteúdo que consome
- **Uso**: Extensão no Crunchyroll, Record & Compare como jogo

---

## Casos de Uso Detalhados

### Caso 1: Preparação para Apresentação
**Cenário**: Maria precisa apresentar em japonês na próxima semana.

1. Abre PitchLab JP web app
2. Cola o texto da apresentação (500 caracteres)
3. Vê o gráfico de pitch de cada frase
4. Clica "Play Native" para cada frase
5. Grava sua própria pronúncia
6. Compara e repete até score > 85%
7. Exporta áudio para usar como referência

**Resultado**: Apresentação fluida, sem erros de pitch.

### Caso 2: Aprendizado Passivo com Netflix
**Cenário**: João assiste anime e quer aprender a pronúncia das legendas.

1. Instala extensão PitchLab JP
2. Assistindo anime, pausa em uma frase interessante
3. Seleciona o texto da legenda
4. Botão direito → "Analyze with PitchLab JP"
5. Popup mostra gráfico de pitch instantaneamente
6. Clica play para ouvir
7. (Pro) Grava e compara rapidamente

**Resultado**: Aprendizado contextual, sem sair do conteúdo.

### Caso 3: Criação de Cards Anki
**Cenário**: Maria cria 50 cards novos por semana.

1. No Anki, cria card com frase japonesa
2. Clica botão "Generate Pitch" (add-on PitchLab JP)
3. Sistema gera:
   - SVG do gráfico de pitch
   - Áudio TTS da frase
   - Informação de padrão (Heiban/Atamadaka/etc)
4. Card pronto em 2 segundos

**Resultado**: Cards consistentes e profissionais, economia de tempo.

---

## Métricas de Sucesso (KPIs)

### Métricas de Produto
- **DAU/MAU**: Usuários ativos diários/mensais
- **Taxa de Retenção D7/D30**: % usuários que voltam após 7/30 dias
- **Consultas por Usuário**: Média de análises por sessão
- **Taxa de Conversão Free → Pro**: % usuários que assinam plano pago
- **Score Médio Record & Compare**: Progressão ao longo do tempo

### Métricas de Engajamento
- **Tempo Médio de Sessão**: Tempo gasto no web app
- **Frequência de Uso da Extensão**: Vezes por semana
- **Cards Anki Gerados**: Volume de exports
- **Repetições Record & Compare**: Quantas vezes usuário grava até ficar satisfeito

### Métricas de Negócio
- **MRR (Monthly Recurring Revenue)**: Receita recorrente mensal
- **CAC (Customer Acquisition Cost)**: Custo de aquisição
- **LTV (Lifetime Value)**: Valor do cliente ao longo da vida
- **Churn Rate**: Taxa de cancelamento
- **NPS (Net Promoter Score)**: Satisfação do cliente

### Métricas Técnicas
- **Latência `/analyze`**: < 500ms (p95)
- **Latência `/tts`**: < 1s (p95)
- **Uptime**: > 99.9%
- **Taxa de Erro**: < 0.1%

---

## Estratégia de Go-to-Market

### Fase 1: Validação (Meses 1-3)
**Objetivo**: Provar que há demanda real

- **Táticas**:
  - Post em r/LearnJapanese com demo
  - Compartilhar em grupos de Facebook de japonês
  - Contatar YouTubers de japonês (Dogen, etc)
  - Beta fechado com 50 usuários ativos

- **Métrica de Sucesso**: 200 usuários ativos, 10% conversão para Pro

### Fase 2: Crescimento Orgânico (Meses 4-6)
**Objetivo**: Construir base de usuários leais

- **Táticas**:
  - SEO: "pitch accent japanese", "ojad alternative"
  - Conteúdo: Blog posts sobre pitch accent
  - Parcerias: Integração oficial com Anki
  - Product Hunt launch
  - Indicação de usuários (referral program)

- **Métrica de Sucesso**: 2.000 usuários, 15% conversão

### Fase 3: Escala (Meses 7-12)
**Objetivo**: Dominar o nicho

- **Táticas**:
  - Marketing pago (Google Ads, Facebook)
  - Parcerias com escolas de japonês
  - API para desenvolvedores
  - Programa de afiliados
  - Conteúdo educacional (YouTube, curso)

- **Métrica de Sucesso**: 10.000 usuários, 20% conversão, $15K MRR

---

## Riscos e Mitigações

### Risco 1: OJAD Melhora a Interface
**Probabilidade**: Média | **Impacto**: Alto

**Mitigação**:
- Foco em diferenciais que OJAD não pode copiar (extensão, Anki, Record & Compare)
- Construir comunidade e lock-in antes que melhorem
- Velocidade de inovação superior

### Risco 2: Custo de TTS Escala Demais
**Probabilidade**: Baixa | **Impacto**: Médio

**Mitigação**:
- Cache agressivo de áudio (mesma frase = mesmo áudio)
- Limites no plano gratuito
- Fallback para TTS mais barato (gTTS) quando possível
- Modelo próprio de TTS (longo prazo)

### Risco 3: Precisão do Pitch Accent
**Probabilidade**: Média | **Impacto**: Alto

**Mitigação**:
- Validação com corpus conhecido (OJAD como benchmark)
- Feedback de usuários nativos japoneses
- Sistema de reporte de erros
- Fallback para tdmelodic quando unidic falha

### Risco 4: Adoção Lenta da Extensão
**Probabilidade**: Média | **Impacto**: Médio

**Mitigação**:
- Onboarding super simples (1 clique)
- Demo em vídeo
- Incentivos (desconto Pro para quem instala)
- Foco inicial em web app (menor barreira)

### Risco 5: Concorrência de Big Techs
**Probabilidade**: Baixa | **Impacto**: Alto

**Mitigação**:
- Nicho muito específico (não é atrativo para Google/Duolingo)
- Complexidade técnica cria barreira de entrada
- Construir comunidade e marca antes

---

## Design Principles

### 1. Clareza Visual
- Gráfico de pitch deve ser **imediatamente compreensível**
- Cores consistentes: Alto = verde, Baixo = azul
- Animações sutis que guiam o olhar

### 2. Feedback Imediato
- Análise deve aparecer em < 500ms
- Loading states claros
- Erros explicados em linguagem simples

### 3. Não Intrusivo
- Extensão não deve "quebrar" sites existentes
- Overlay discreto, pode ser minimizado
- Respeitar preferências de acessibilidade

### 4. Gamificação Sutil
- Score de melodia é motivador, não punitivo
- Progresso visual claro
- Celebrações pequenas em marcos

### 5. Acessibilidade
- Suporte a leitores de tela
- Contraste adequado (WCAG AA)
- Teclado navigation completo

---

## Arquitetura de Dados

### Fluxo de Dados Principal

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│   Frontend      │──────▶│  FastAPI     │
│   (Next.js)     │◀──────│  Backend     │
└─────────────────┘      └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │  MeCab   │ │  Azure   │ │ Parsel-  │
            │ +UniDic  │ │   TTS    │ │  mouth   │
            └──────────┘ └──────────┘ └──────────┘
                    │           │           │
                    └───────────┼───────────┘
                                ▼
                        ┌──────────────┐
                        │   Response   │
                        │   (JSON)     │
                        └──────────────┘
```

### Estrutura de Dados

**Request `/analyze`**:
```json
{
  "text": "昨日は肉を食べました",
  "format": "kana" | "kanji"
}
```

**Response `/analyze`**:
```json
{
  "words": [
    {
      "surface": "昨日",
      "reading": "きのう",
      "pitch_pattern": "heiban",
      "aType": 0,
      "mora_count": 2,
      "pitch_visualization": [1, 1, 0, 0]
    }
  ],
  "full_text_reading": "きのうはにくをたべました"
}
```

**Request `/compare`**:
```json
{
  "audio_base64": "...",
  "expected_pitch": [1, 1, 0, 0, ...],
  "language": "ja-JP"
}
```

**Response `/compare`**:
```json
{
  "similarity_score": 0.87,
  "alignment": [...],
  "feedback": "Excelente! Melhore apenas a transição na 3ª mora."
}
```

---

## FAQ

### P: O PitchLab JP substitui um professor?
**R**: Não. É uma ferramenta complementar. Professores focam em gramática, vocabulário, contexto cultural. PitchLab JP foca exclusivamente em pronúncia e entonação.

### P: Funciona offline?
**R**: Não no MVP. A análise requer MeCab/UniDic no servidor. Extensão pode ter cache local para consultas recentes (futuro).

### P: Suporta dialetos regionais?
**R**: Não inicialmente. Foco em japonês padrão (標準語). Dialetos podem ser adicionados depois com dados específicos.

### P: Preciso saber ler japonês?
**R**: Não necessariamente. O gráfico visual funciona mesmo sem ler kanji. Mas conhecimento básico de hiragana ajuda.

### P: Como funciona o Record & Compare?
**R**: Usa análise de pitch (F0) via Parselmouth. Compara sua curva de pitch com a esperada usando DTW (Dynamic Time Warping) para alinhamento temporal.

### P: Posso usar a API comercialmente?
**R**: Sim, com plano Enterprise. API tem rate limits e precisa de autenticação.

### P: O áudio TTS é de nativos?
**R**: Sim, Azure AI Speech usa vozes neurais treinadas em falantes nativos. Não são gravações, mas síntese de alta qualidade.

### P: E se uma palavra não estiver no dicionário?
**R**: Sistema usa tdmelodic (modelo neural) para inferir pitch de palavras desconhecidas. Precisão é ~85% vs. ~95% para palavras conhecidas.

---

## Links Úteis

- [fugashi](https://github.com/polm/fugashi) - MeCab wrapper
- [unidic](https://pypi.org/project/unidic/) - Dicionário com pitch
- [tdmelodic](https://github.com/PKSHATechnology-Research/tdmelodic) - Gerador neural
- [Azure Speech](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/) - TTS
- [Parselmouth](https://github.com/YannickJadworski/Parselmouth) - Análise de pitch
- [OJAD](http://www.gavo.t.u-tokyo.ac.jp/ojad/) - Referência original
- [MeCab](https://taku910.github.io/mecab/) - Tokenizador japonês
- [DTW Algorithm](https://en.wikipedia.org/wiki/Dynamic_time_warping) - Alinhamento temporal
