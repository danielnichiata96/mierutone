# PitchLab JP - Production Checklist

## Pendente

### 1. Configurar Cloudflare R2
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

### 2. Redis em Produção
- [ ] Escolher provedor: Upstash (serverless) ou Redis Cloud
- [ ] Configurar `REDIS_URL` no `.env`

### 3. Docker Compose para Produção
- [ ] Criar `docker-compose.prod.yml` com Nginx + SSL

---

## Concluído

- [x] Implementar cache Redis (hot)
- [x] Implementar storage R2 (cold)
- [x] Endpoints de cache stats/health
- [x] Atualizar `.env.example`
