## Running in Dev Mode (Vite + Hot Reload)

This repo supports two Docker Compose modes:

- **Production-style** (`docker-compose.yml`): builds the client and serves it from the API container.
- **Development** (`docker-compose.dev.yml`): runs the Vite client separately for fast refresh/hot reload.

### Start Dev Mode

From the repo root (where `docker-compose.dev.yml` is located):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open in your browser:

- **Client (Vite / React):** http://localhost:3000  
- **API (Express):** http://localhost:5000  

### Start Dev Mode (Detached)

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### Stop Dev Mode

```bash
docker compose -f docker-compose.dev.yml down
```

### Check Running Services / Ports

```bash
docker compose -f docker-compose.dev.yml ps
```

### View Logs

```bash
docker compose -f docker-compose.dev.yml logs -f client
docker compose -f docker-compose.dev.yml logs -f api
```

---

## PowerShell Convenience Alias (Persistent)

If you're using Windows PowerShell, you can create a persistent shortcut so you don’t have to type the full dev compose command every time.

### Create a “dcd” shortcut (run once)

This adds a function to your PowerShell profile so it loads automatically in new terminal windows:

```powershell
'function dcd { docker compose -f docker-compose.dev.yml up --build -d @args }' | Add-Content -Path $PROFILE; . $PROFILE
```

After that, from the repo root you can run:

```powershell
dcd
```

### Where is this saved?

PowerShell loads your profile on startup. You can see the profile path with:

```powershell
$PROFILE
```

> If your profile file doesn’t exist yet, PowerShell will create it when you run the command above.

---

## Which URL should I use?

- If you ran **dev mode** (`docker-compose.dev.yml`) → use **http://localhost:3000**
- If you ran **production-style** (`docker-compose.yml`) → the client is served by the API and you should use **http://localhost:5000**


## zsh (macOS default, also common on Linux)

Add a persistent alias


```bash
echo 'alias dcd="docker compose -f docker-compose.dev.yml up --build -d"' >> ~/.zshrc
source ~/.zshrc
```
Use it

From your repo root:

```bash
dcd
```

## bash (Ubuntu default, sometimes macOS)
Add a persistent alias

```bash
echo 'alias dcd="docker compose -f docker-compose.dev.yml up --build -d"' >> ~/.bashrc
source ~/.bashrc
```
Use it

```bash
dcd
```

On macOS bash, you may need ~/.bash_profile instead of ~/.bashrc:

```bash
echo 'alias dcd="docker compose -f docker-compose.dev.yml up --build -d"' >> ~/.bash_profile
source ~/.bash_profile
```

## Optional “nice to have” helpers (recommended)

## Down
```bash
echo 'alias dcddown="docker compose -f docker-compose.dev.yml down"' >> ~/.zshrc
source ~/.zshrc
```
Logs (follow)
```bash
echo 'alias dcdlogs="docker compose -f docker-compose.dev.yml logs -f"' >> ~/.zshrc
source ~/.zshrc
```

Usage:
```bash
dcddown
dcdlogs client
dcdlogs api
```

(If you’re using bash, replace ~/.zshrc with ~/.bashrc in the lines above.)


## Make it work from anywhere (not just repo root)

Aliases run relative to your current directory. If you want the command to work from any folder, create a function that cds to your repo first.

```zsh
# zsh example
cat >> ~/.zshrc <<'EOF'
condo_root="$HOME/path/to/condo-app"
dcd() { (cd "$condo_root" && docker compose -f docker-compose.dev.yml up --build -d "$@"); }
dcddown() { (cd "$condo_root" && docker compose -f docker-compose.dev.yml down "$@"); }
dcdlogs() { (cd "$condo_root" && docker compose -f docker-compose.dev.yml logs -f "$@"); }
EOF

source ~/.zshrc
```

Replace:

`$HOME/path/to/condo-app` with your actual repo folder.

How to confirm it’s persistent

zsh loads: `~/.zshrc`

bash loads: `~/.bashrc` (Linux) or `~/.bash_profile` (macOS bash)

To see which shell you’re currently using:

```bash
echo $SHELL
```