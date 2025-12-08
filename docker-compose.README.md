# Docker Compose for Local Testing

This directory contains Docker Compose configurations for different environments.

## Files

- `docker-compose.yml` - Local prod-like environment for testing
- `docker-compose.prod.yml` - Production configuration (used by GitHub Actions)

## Local Testing (Prod-like Environment)

### Prerequisites

1. **Docker and Docker Compose V2:**
   - Docker must be installed
   - Docker Compose V2 plugin is required (we use `docker compose` with space)
   - To check: `docker compose version`
   - If `docker compose` doesn't work, install/enable the plugin:
     
     **For Docker Desktop (Windows/Mac):**
     - Open Docker Desktop → Settings → General
     - Enable "Use Docker Compose V2"
     - Restart Docker Desktop
     
     **For Linux/WSL2:**
     ```bash
     # Install Docker Compose V2 plugin
     mkdir -p ~/.docker/cli-plugins/
     curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o ~/.docker/cli-plugins/docker-compose
     chmod +x ~/.docker/cli-plugins/docker-compose
     
     # Verify installation
     docker compose version
     ```
     
     **Alternative (if above doesn't work):**
     ```bash
     # Install via Docker's plugin system
     DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
     mkdir -p $DOCKER_CONFIG/cli-plugins
     curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o $DOCKER_CONFIG/cli-plugins/docker-compose
     chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
     ```

2. Make sure you have a `.env.local` file with the required variables:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your actual values
   ```

3. Required environment variables (in `.env.local` file):
   - `NOTION_TOKEN` - Your Notion integration token
   - `NOTION_DATABASE_ID` - Your Notion database ID
   - `REVALIDATE_SECRET` - A random secret for revalidation
   - `NEXT_PUBLIC_APP_URL` - URL for the app (e.g., `http://localhost:5680`)

### Usage

All commands use `docker compose` (with space) - the Docker Compose V2 plugin.

1. **Build and start the container:**
   ```bash
   # Use --env-file to read from .env.local for build args
   docker compose --env-file .env.local up --build
   ```
   
   **Alternative:** Create a symlink so docker-compose reads .env automatically:
   ```bash
   ln -s .env.local .env
   docker compose up --build
   ```

2. **Start in detached mode:**
   ```bash
   docker compose up -d --build
   ```

3. **View logs:**
   ```bash
   docker compose logs -f
   ```

4. **Stop the container:**
   ```bash
   docker compose down
   ```

5. **Rebuild after code changes:**
   ```bash
   docker compose up --build
   ```

### Access the Application

Once running, the application will be available at:
- **URL:** http://localhost:5680

### Differences from Production

- Uses direct port mapping instead of Traefik reverse proxy
- Runs on a local bridge network instead of external Traefik network
- No SSL/TLS termination (handled by Traefik in production)
- Same build process and runtime environment as production

### Troubleshooting

1. **Port already in use:**
   - Change the port mapping in `docker-compose.yml` (e.g., `"3000:5680"`)

2. **Build fails:**
   - Make sure all environment variables are set in `.env.local` file
   - Check that `NOTION_TOKEN` and `NOTION_DATABASE_ID` are correct
   - Verify `.env.local` file exists in the root directory
   - Make sure you're using `--env-file .env.local` flag

3. **Container won't start:**
   - Check logs: `docker compose logs`
   - Verify `.env.local` file exists and has all required variables

4. **Health check fails:**
   - Wait a bit longer for the app to start (start_period is 40s)
   - Check if the app is actually running: `docker compose ps`

5. **"docker compose" command not found:**
   - Install/enable Docker Compose V2 plugin (see Prerequisites section)
   - After installation, verify with: `docker compose version`
   - Make sure the plugin is executable: `chmod +x ~/.docker/cli-plugins/docker-compose`
