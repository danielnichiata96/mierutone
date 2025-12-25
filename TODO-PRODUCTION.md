# MieruTone - Production Checklist

## Concluído

### 1. Deploy Backend (Railway)
- [x] Criar conta Railway: https://railway.app
- [x] New Project → Deploy from GitHub → `danielnichiata96/mierutone`
- [x] Dockerfile na raiz do projeto (build context)
- [x] Adicionar Redis: + New → Database → Redis
- [x] Configurar variáveis de ambiente:
  ```env
  AZURE_SPEECH_KEY=xxx
  AZURE_SPEECH_REGION=eastus
  REDIS_ENABLED=true
  REDIS_URL=redis://...
  R2_ENABLED=true
  R2_ACCOUNT_ID=xxx
  R2_ACCESS_KEY_ID=xxx
  R2_SECRET_ACCESS_KEY=xxx
  R2_BUCKET_NAME=mierutone-tts-cache
  ```
- [x] URL do backend: `https://mierutone-production.up.railway.app`

### 2. Deploy Frontend (Vercel)
- [x] Criar conta Vercel: https://vercel.com
- [x] Import Project → `danielnichiata96/mierutone`
- [x] Configurar Root Directory: `frontend`
- [x] Configurar variável de ambiente:
  ```env
  NEXT_PUBLIC_API_URL=https://mierutone-production.up.railway.app/api
  ```
- [x] URL do frontend: `https://mierutone.vercel.app`

### 3. Cloudflare R2 (Cold Storage)
- [x] Criar bucket `mierutone-tts-cache` no R2
- [x] Criar API Token (R2 > Manage R2 API Tokens)
- [x] Configurar variáveis no Railway
- [x] Verificar conexão: `/api/tts/cache/stats`

### 4. Redis (Hot Cache)
- [x] Railway Redis integrado
- [x] Verificar conexão: `/api/tts/cache/health`

### 5. NLP Engine
- [x] Migrar de Fugashi/UniDic para SudachiPy/Kanjium
- [x] Banco SQLite com 124k+ pitch accents (CC BY-SA 4.0)
- [x] Testes de integração passando

---

## Pendente

### 6. Banco de Dados (Usuários/Auth)
- [ ] Escolher: Railway Postgres vs Supabase vs PlanetScale
- [ ] Schema: users, progress, favorites
- [ ] Auth: NextAuth.js ou Clerk

### 7. (Opcional) Docker Compose Local
- [ ] Criar `docker-compose.yml` para desenvolvimento local

### 8. Domínio Customizado
- [ ] Registrar domínio `mierutone.com`
- [ ] Configurar DNS na Vercel (frontend)
- [ ] Configurar DNS no Railway (backend API)

---

## URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend | https://mierutone.vercel.app |
| Backend | https://mierutone-production.up.railway.app |
| Health | https://mierutone-production.up.railway.app/health |
| API Docs | https://mierutone-production.up.railway.app/docs |
| Cache Stats | https://mierutone-production.up.railway.app/api/tts/cache/stats |

## Limites Free Tier

| Serviço | Limite |
|---------|--------|
| Railway | $5/mês crédito |
| Vercel | 100GB bandwidth |
| Cloudflare R2 | 10GB storage, egress ilimitado |
| Azure TTS | 500k chars/mês (free tier) |
