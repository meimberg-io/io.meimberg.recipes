# Deployment

Automatic deployment on push to `main` via GitHub Actions.

## Deploy

```bash
git push origin main
```

Watch: https://github.com/meimberg-io/io.meimberg.recipes/actions

**Duration:** ~3-4 minutes

## How It Works

1. Checkout code
2. Build Docker image with build args
3. Push to GitHub Container Registry
4. Copy `docker-compose.prod.yml` to server
5. SSH to server and run `envsubst` to substitute variables
6. Pull image and restart container

**File:** `.github/workflows/deploy.yml`
**Template:** `docker-compose.prod.yml` (uses `${PROJECT_NAME}`, `${DOCKER_IMAGE}`, `${APP_DOMAIN}`)

## Initial Setup

**First time?** See [GITHUB-SETUP.md](GITHUB-SETUP.md) for:
- GitHub Secrets/Variables
- DNS configuration
- SSH keys
- Server setup

## Operations

**View logs:**
```bash
ssh deploy@hc-02.meimberg.io "docker logs recipes -f"
```

**Restart:**
```bash
ssh deploy@hc-02.meimberg.io "cd /srv/projects/recipes && docker compose restart"
```

**Manual deploy:**
```bash
ssh deploy@hc-02.meimberg.io "cd /srv/projects/recipes && docker compose pull && docker compose up -d"
```

## Troubleshooting

**Container logs:**
```bash
ssh deploy@hc-02.meimberg.io "docker logs recipes --tail 100"
```

**Traefik routing:**
```bash
ssh deploy@hc-02.meimberg.io "docker logs traefik --tail 50"
```

**Check running containers:**
```bash
ssh deploy@hc-02.meimberg.io "docker ps"
```

**DNS:**
```bash
dig recipes.meimberg.io +short
```

**Test direct access:**
```bash
curl -I https://recipes.meimberg.io/
```

## Configuration

**Environment Variables (GitHub Secrets):**
- `SSH_PRIVATE_KEY` - SSH key for server access
- `REVALIDATE_SECRET` - Next.js revalidation secret
- `NOTION_TOKEN` - Notion API integration token
- `NOTION_DATABASE_ID` - Notion database ID

**Environment Variables (GitHub Variables):**
- `SERVER_HOST` - Server hostname (hc-02.meimberg.io)
- `SERVER_USER` - SSH user (deploy)
- `APP_DOMAIN` - Application domain (recipes.meimberg.io)
- `NEXT_PUBLIC_APP_URL` - Frontend base URL (https://recipes.meimberg.io)

**Runtime Environment Variables (set in `.env` on server):**
- `NOTION_TOKEN` - Notion API integration token
- `NOTION_DATABASE_ID` - Notion database ID
- `REVALIDATE_SECRET` - Next.js revalidation secret
- `NEXT_PUBLIC_APP_URL` - Frontend base URL

## Build Args

The following are passed as Docker build arguments:
- `NEXT_PUBLIC_APP_URL` - Baked into client bundle

## Server Access

**SSH User:** `deploy`

```bash
ssh deploy@hc-02.meimberg.io
```

**Project Directory:** `/srv/projects/recipes/`

