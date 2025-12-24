# PitchLab JP - Production Checklist

## Pendente

### 1. Deploy Backend (Railway)
- [ ] Criar conta Railway: https://railway.app
- [ ] New Project → Deploy from GitHub → `danielnichiata96/mierutone`
- [ ] Configurar Root Directory: `backend`
- [ ] Adicionar Redis: + New → Database → Redis
- [ ] Configurar variáveis de ambiente:
  ```env
  AZURE_SPEECH_KEY=sua_key
  AZURE_SPEECH_REGION=eastus
  REDIS_ENABLED=true
  R2_ENABLED=false
  ```
- [ ] Anotar URL do backend para usar no frontend

### 2. Deploy Frontend (Vercel)
- [ ] Criar conta Vercel: https://vercel.com
- [ ] Import Project → `danielnichiata96/mierutone`
- [ ] Configurar Root Directory: `frontend`
- [ ] Configurar variável de ambiente:
  ```env
  NEXT_PUBLIC_API_URL=https://seu-backend.railway.app
  ```

### 3. Configurar Cloudflare R2
- [ ] Criar conta Cloudflare (se não tiver)
- [ ] Criar bucket `pitchlab-tts-cache` no R2
- [ ] Criar API Token (R2 > Manage R2 API Tokens)
- [ ] Configurar variáveis no `.env`:
  ```env
  R2_ENABLED=true
  R2_ACCOUNT_ID=xxx
  R2_ACCESS_KEY_ID=xxx
  R2_SECRET_ACCESS_KEY=xxx
  R2_BUCKET_NAME=pitchlab-tts-cache
  ```

### 4. Redis em Produção
- [x] Railway inclui Redis integrado (configurado automaticamente)

### 5. (Opcional) Docker Compose Local
- [ ] Criar `docker-compose.yml` para desenvolvimento local

---

## Concluído

- [x] Implementar cache Redis (hot)
- [x] Implementar storage R2 (cold)
- [x] Endpoints de cache stats/health
- [x] Atualizar `.env.example`
