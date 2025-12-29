# Relatório de Revisão Linguística e Pedagógica (Completo)

**Data:** 29/12/2025
**Revisor:** Antigravity (Professor de Japonês e Linguista)
**Escopo:** Frontend Core (`/learn`, `/examples`, Componentes, Dados de Quiz)

## Resumo da Avaliação

A estrutura pedagógica geral é sólida e o design visual auxilia muito no aprendizado. No entanto, foi identificada uma **alta taxa de erro na classificação de palavras no arquivo de dados do Quiz (`quizWords.ts`)**, especificamente na distinção entre os padrões Odaka (Cauda-Alta), Nakadaka (Meio-Alto) e Heiban (Plano).

Esses erros são críticos pois ensinam padrões de entonação incorretos para vocabulário básico.

## Detalhamento das Críticas

### 1. Erros Críticos de Classificação em `src/data/quizWords.ts`

Encontrei múltiplas palavras classificadas no padrão errado. Isso é comum para falantes não nativos, mas fatal para um aplicativo de ensino.

#### A. Confusão Odaka vs. Heiban (2 Moras)
Algumas palavras foram identificadas incorretamente, porém após verificação com banco de dados NHK, *Yama* e *Kawa* estão corretas como Odaka (padrão antigo/escrito). O erro principal está em:

| Palavra | Leitura | Está como | Correto | Nota |
| :--- | :--- | :--- | :--- | :--- |
| **鼻** | Hana | Odaka | **Heiban (0)** | Pronúncia `ha-NA(-ga)`. (Diferente de `Hana` flor, que é Odaka). |

#### B. Confusão Nakadaka vs. Odaka (3+ Moras)
Várias palavras listadas como **Nakadaka** (Cai no meio) são preferencialmente **Odaka** (Cai após a última mora) segundo o padrão NHK.

| Palavra | Leitura | Está como | Correto | Nota |
| :--- | :--- | :--- | :--- | :--- |
| **男** | Otoko | Nakadaka | **Odaka (3)** | Pronúncia `o-TO-KO(-ga)`, cai na partícula. |
| **女** | Onna | Nakadaka | **Odaka (3)** | Pronúncia `o-N-NA(-ga)`, cai na partícula. |
| **頭** | Atama | Nakadaka | **Odaka (3)** | Pronúncia `a-TA-MA(-ga)`, cai na partícula. |

**Impacto:** O aluno aprenderá a "derrubar" o tom antes do final da palavra (ex: `o-TO-ko`), o que soará artificial ou errado, em vez de manter o tom alto até o final (`o-TO-KO`).

### 2. A Distinção "Hashi" (Pedagógico)

Conforme notado anteriormente em `src/app/learn/page.tsx` e `src/components/QuickExamples.tsx`:
- O par **Hashi (Ponte)** vs **Hashi (Pauzinhos)** é usado corretamente como Odaka vs Atamadaka.
- **Porém**, sem uma partícula (como `ga` ou `wo`), um iniciante não consegue ouvir a diferença entre Odaka e Heiban.
- *Recomendação:* Adicionar visualmente a partícula fantasma ou uma nota explicativa: "Odaka: O tom cai *após* a palavra".

### 3. Componente `HowItWorks.tsx`

- As definições teóricas dos 4 padrões (Heiban, Atamadaka, Nakadaka, Odaka) estão **corretas**.
- O exemplo visual para Odaka usa uma seta para baixo `↓` após a última mora. Isso é uma **excelente** decisão de design e mitiga o problema da falta de partícula mencionado acima, desde que o usuário entenda o que a seta significa.

### 4. Exemplos Gerais (`src/data/examples.ts`)

- A lista de verbos, adjetivos e saudações está correta e segue o padrão de Tóquio.
- O uso da **Forma de Dicionário** para verbos é a escolha correta para ensino de pitch accent.

## Plano de Correção Sugerido

1.  **DADOS (Prioridade Alta):** Corrigir imediatamente o arquivo `src/data/quizWords.ts`. Substituir as palavras incorretas por verdadeiros representantes de suas categorias ou corrigir suas classificações.
    *   *Sugestão para Odaka:* Hashi (Ponte), Hana (Flor), Koko (Aqui), Soto (Fora).
    *   *Sugestão para Nakadaka:* Kokoro (Coração), Tamago (Ovo), Anata (Você), Midori (Verde).
2.  **INTERFACE:** Adicionar notas de rodapé ou dicas visuais sobre a queda de tom nas partículas para palavras Odaka.

**Nota Final:** O aplicativo tem potencial excelente, mas a limpeza dos dados do Quiz é urgente.
