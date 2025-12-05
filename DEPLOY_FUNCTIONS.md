# Deploy Edge Functions (Dev Container Edition)

Since npm installation of Supabase CLI isn't supported in this environment, here are your deployment options:

## Option 1: Deploy from Your Local Machine (Easiest)

If you have a local terminal on your computer:

```bash
# 1. Install Supabase CLI (one-time)
# On macOS:
brew install supabase/tap/supabase

# On Windows:
choco install supabase

# On Linux:
curl -fsSL https://deb.supabase.com/keys/supabase-archive-keyring.gpg | sudo gpg --dearmor -o /usr/share/keyrings/supabase-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/supabase-archive-keyring.gpg] https://deb.supabase.com/debian/jammy jammy main" | sudo tee /etc/apt/sources.list.d/supabase.list
sudo apt-get update && sudo apt-get install -y supabase

# 2. Navigate to this repo on your machine
cd /path/to/BurnBookold

# 3. Run these commands
supabase login
supabase link --project-id ldlaljwckqvdmoqbsdto
supabase secrets set AZURE_AI_ENDPOINT="https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project"
supabase secrets set AZURE_AI_KEY="ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG"
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query

# 4. Done! Come back to dev container and test
npm run dev
```

## Option 2: Manual Deployment via Supabase Dashboard (No CLI Needed)

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Select project: `ldlaljwckqvdmoqbsdto`

2. **Create analyze-sentiment Function**
   - Click "Functions" in sidebar
   - Click "Create function"
   - Name: `analyze-sentiment`
   - Copy code from: `/workspaces/BurnBookold/supabase/functions/analyze-sentiment/index.ts`
   - Paste it into the editor
   - Click "Deploy"

3. **Create nl-query Function**
   - Click "Create function"
   - Name: `nl-query`
   - Copy code from: `/workspaces/BurnBookold/supabase/functions/nl-query/index.ts`
   - Paste it into the editor
   - Click "Deploy"

4. **Set Environment Variables**
   - Go to Functions → Settings
   - Add secrets:
     - Name: `AZURE_AI_ENDPOINT`
     - Value: `https://eus1-c-oai-01.services.ai.azure.com/api/projects/eus1-c-oai-01-project`
     - Name: `AZURE_AI_KEY`
     - Value: `ENJrAMmqr9W63Pwr1dX9FOlWXy6Riw6MdHClaWtMOK3JtKo8RH2ZJQQJ99BAACYeBjFXJ3w3AAABACOGvkgG`

5. **Test It**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3002
   - Go to "📥 Ingest Data" tab
   - Paste: `https://reddit.com/r/ems`
   - Click "Analyze"

## Option 3: Use Docker (Advanced)

If you want to deploy from this container:

```bash
# Install Docker in the container
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Run Supabase CLI in Docker
docker run -it -v ~/.supabase:/root/.supabase supabase/cli login
docker run -it -v $(pwd):/app -w /app supabase/cli link --project-id ldlaljwckqvdmoqbsdto
docker run -it -v $(pwd):/app -w /app supabase/cli secrets set AZURE_AI_ENDPOINT="..."
docker run -it -v $(pwd):/app -w /app supabase/cli functions deploy analyze-sentiment
```

## Option 4: Wait for Supabase CLI Update (Easiest for Future)

The Supabase team is working on better npm support. You can:

1. Check back later
2. Use Option 1 or 2 in the meantime
3. Both work perfectly fine!

## Recommendation

**Best Option: Option 1** (Deploy from your local machine)
- Easiest and fastest
- All tools available natively
- One-time setup

**If you don't have local CLI:** Option 2 (Dashboard)
- Works entirely in your browser
- No command line needed
- Still super fast

**After deployment:** Everything works in the dev container!

## Verify Deployment

Once deployed, check that functions are live:

```bash
curl https://ldlaljwckqvdmoqbsdto.supabase.co/functions/v1/analyze-sentiment \
  -H "Authorization: Bearer $(cat .env.local | grep VITE_SUPABASE_ANON_KEY | cut -d'=' -f2)" \
  -X POST \
  -d '{"url":"https://reddit.com/r/ems"}'
```

You should get a response (not a 404).

## Test After Deployment

```bash
npm run dev
# Open http://localhost:3002
# Go to "📥 Ingest Data" tab
# Paste Reddit URL
# Click "Analyze"
```

You should see: "✅ Found X posts, analyzed Y"

## Need Help?

- **Stuck on deployment?** Try Option 2 (Dashboard) - it's the easiest
- **Want to use CLI?** Use Option 1 from your local machine
- **Still having issues?** Check `EDGE_FUNCTION_ERROR.md` for troubleshooting

## Timeline

- Option 1: 5 minutes (from local machine)
- Option 2: 10 minutes (via dashboard)
- Option 3: 15-20 minutes (Docker)

**Recommended: Start with Option 2 if you don't have CLI on your machine!**
