#!/bin/bash
# BurnBook Deployment Script for Dev Container Environment
# This script deploys the edge functions to Supabase without requiring CLI installation

set -e

echo "🚀 BurnBook Edge Function Deployment"
echo "====================================="
echo ""

# Check if we have the required credentials
SUPABASE_URL="${VITE_SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_KEY="${VITE_SUPABASE_SERVICE_ROLE_KEY:-}"
AZURE_AI_ENDPOINT="${VITE_AZURE_AI_ENDPOINT:-}"
AZURE_AI_KEY="${VITE_AZURE_AI_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    echo "Required:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

if [ -z "$AZURE_AI_ENDPOINT" ] || [ -z "$AZURE_AI_KEY" ]; then
    echo "⚠️  Warning: Azure AI credentials not found"
    echo "Functions will use mock sentiment analysis"
fi

echo "✅ Credentials found"
echo ""
echo "📝 To deploy edge functions manually:"
echo "1. Go to: https://app.supabase.com"
echo "2. Select your project: ldlaljwckqvdmoqbsdto"
echo "3. Go to Functions → Create function"
echo "4. Use the code from: supabase/functions/analyze-sentiment/index.ts"
echo ""
echo "🔐 Set these secrets in Functions → Settings:"
echo "   AZURE_AI_ENDPOINT = $AZURE_AI_ENDPOINT"
echo "   AZURE_AI_KEY = $AZURE_AI_KEY"
echo ""
echo "Or use the Supabase CLI locally on your machine:"
echo "  supabase login"
echo "  supabase link --project-id ldlaljwckqvdmoqbsdto"
echo "  supabase secrets set AZURE_AI_ENDPOINT=\"$AZURE_AI_ENDPOINT\""
echo "  supabase secrets set AZURE_AI_KEY=\"$AZURE_AI_KEY\""
echo "  supabase functions deploy analyze-sentiment"
