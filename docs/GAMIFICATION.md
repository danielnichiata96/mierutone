# PitchLab JP - Gamification Strategy

> **Insight Central**: Usuários sérios rejeitam competição artificial. Querem progresso tangível e experiência relaxante.

---

## O que NÃO fazer

| Anti-Pattern | Por quê evitar |
|--------------|----------------|
| Leaderboards/Ligas | "Leaderboard fatigue" - gera ansiedade, não retenção |
| Perda de streak punitiva | Ressentimento, usuário abandona |
| Notificações agressivas | Público avançado odeia ser tratado como criança |
| Gamificação que premia velocidade | Pronúncia exige lentidão e repetição |

---

## Aplicar AGORA (Já alinhado)

| Elemento | Status |
|----------|--------|
| Visualização "escada" limpa | ✅ Implementado |
| Cores consistentes (coral=H, cornflower=L) | ✅ Implementado |
| Sem competição | ✅ Não tem |
| Feedback visual imediato | ✅ Score 0-100 |

---

## Aplicar em BREVE (Fase 4-5)

### 1. Estatísticas de Progresso
```
- Palavras praticadas hoje/semana
- Score médio ao longo do tempo
- "Palavras problemáticas" (score < 60)
- Gráfico de evolução
```

### 2. Modo Ritmo (MVP)
```
Inspiração: Guitar Hero simplificado

- Moras "deslizam" da direita para esquerda
- Usuário fala no timing certo
- Feedback: Perfect / Good / Miss
- Sem game over - apenas score no final

Por quê funciona:
- Japonês é mora-timed (cada mora = mesma duração)
- Treina timing + pitch simultaneamente
- Estado de "flow" = sessões mais longas
```

### 3. Importação de Conteúdo
```
- Colar frase de anime/drama → gerar escada
- Integração Anki (futuro add-on)
- Isso transforma ferramenta em "companheiro de imersão"
```

---

## Aplicar no FUTURO (Fase 6+)

### Gamificação "Cozy" (Jardim Zen)

**Conceito**: Prática consistente "cultiva" um jardim virtual.

```
Mecânica:
- Cada sessão gera "água"
- Palavras novas = sementes
- Repetição espaçada = crescimento
- Jardim denso = progresso visual

Por quê funciona:
- Compromisso emocional ("cuidar") vs estresse ("vencer")
- Retenção de longo prazo
- Apela ao público "Studygram" estético
```

**Elementos opcionais:**
- Sazonalidade (cerejeiras na primavera, neve no inverno)
- Personalização de cenário
- Troféus para palavras difíceis dominadas

### Coleção/Museu
```
- "Pokédex" de palavras dominadas
- Ao acertar palavra difícil (ex: atatakakatta) → troféu
- Apela a Achievers/Collectors sem competição
```

---

## Requisitos Técnicos (Referência)

### Para Modo Ritmo funcionar:
- Latência < 100ms (processamento client-side)
- Algoritmo YIN/pYIN para detecção de pitch
- Handling de desvoicing (vogais sussurradas)

### Para Escada limpa:
- Quantização de F0 em degraus discretos
- "Linha fantasma" para moras desvozeadas
- Filtrar vibrato/tremor natural da voz

---

## Priorização

| Fase | Feature | Impacto | Esforço |
|------|---------|---------|---------|
| 4 | Stats básicos (palavras/dia, score médio) | Alto | Baixo |
| 4 | Histórico de scores por palavra | Alto | Médio |
| 5 | Modo Ritmo (MVP) | Muito Alto | Alto |
| 6 | Jardim Zen | Médio | Alto |
| 6 | Coleção/Troféus | Baixo | Médio |

---

## Resumo Executivo

**Gamificação ideal para PitchLab JP:**

1. **Sessão de estudo** → Ritmo (flow state, precisão)
2. **Meta-progressão** → Cozy (jardim, coleção)
3. **Modelo** → Freemium com estética paga

**Diferencial competitivo:**
- Migaku = input (ouvir)
- OJAD = referência (consultar)
- PitchLab = output (falar e ver)

A combinação de visualização precisa + gamificação acolhedora define o futuro das ferramentas de pronúncia.
