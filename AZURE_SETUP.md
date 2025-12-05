# Azure AI Foundry Setup Guide for BurnBook

This guide walks you through setting up Azure AI Foundry to power the sentiment analysis for Reddit posts in BurnBook.

## Prerequisites

- Azure subscription (create at https://azure.microsoft.com)
- Azure AI Foundry hub access
- Azure CLI (optional, for advanced setup)

## Step 1: Create Azure AI Foundry Hub

1. Go to https://ai.azure.com
2. Click "Create" or go to your existing hub
3. Select your subscription and resource group
4. If needed, create a new resource group (e.g., "burnbook-rg")
5. Give your hub a name (e.g., "burnbook-hub")
6. Select a region (e.g., "East US")
7. Click "Create"

## Step 2: Create an Azure Language Service

1. In the Azure portal (https://portal.azure.com)
2. Create a new resource by clicking "Create a resource"
3. Search for "Language"
4. Click on "Language service" by Microsoft
5. Click "Create"
6. Fill in:
   - **Resource group**: Same as your hub (e.g., "burnbook-rg")
   - **Region**: Same as your hub (e.g., "East US")
   - **Name**: Give it a name (e.g., "burnbook-language")
   - **Pricing tier**: Standard (S)
7. Click "Create and continue to deploy"

## Step 3: Get Your API Credentials

### Option A: From Azure Portal

1. Go to your Language service in Azure Portal
2. Click "Keys and Endpoint" in the left menu
3. Copy:
   - **Key 1** or **Key 2** (API Key)
   - **Endpoint** URL

### Option B: From Azure AI Foundry

1. Go to https://ai.azure.com
2. Click on your hub
3. In the left menu, go to "Settings" > "Resource"
4. Find your Language service resource
5. Note the endpoint and key from the details

## Step 4: Update Environment Variables

Update your `.env.local` file with your Azure credentials:

```dotenv
VITE_AZURE_AI_ENDPOINT=https://your-region.api.cognitive.microsoft.com
VITE_AZURE_AI_KEY=your-actual-api-key-here
```

**Important**: 
- The `VITE_AZURE_AI_ENDPOINT` should be the base endpoint, NOT a specific operation URL
- The endpoint typically looks like: `https://eastus.api.cognitive.microsoft.com`
- Do NOT include `/language/:analyze-text` or other paths in the endpoint

## Step 5: Verify Configuration

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Test the sentiment analysis:
   - Go to the "Ingest Data" tab
   - Paste a Reddit URL
   - If successful, you should see: "Found X posts, analyzed Y"
   - If using Azure AI, you'll see logs showing Azure AI responses

## Step 6: Deploy Edge Function to Supabase

The edge function needs to be deployed with the Azure credentials:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-id your-project-id

# Set secrets for the edge function
supabase secrets set AZURE_AI_ENDPOINT="https://your-region.api.cognitive.microsoft.com"
supabase secrets set AZURE_AI_KEY="your-actual-api-key-here"

# Deploy the edge function
supabase functions deploy analyze-sentiment
supabase functions deploy nl-query
```

## Supported Azure Regions

Common regions for Language Service:
- `eastus` - East US
- `westus` - West US
- `eastus2` - East US 2
- `westus2` - West US 2
- `centralus` - Central US
- `northeurope` - North Europe
- `westeurope` - West Europe
- `southeastasia` - Southeast Asia

Your endpoint will be: `https://{region}.api.cognitive.microsoft.com`

## Understanding the Setup

BurnBook uses Azure Language Service for:

### Sentiment Analysis
- Determines if text is positive, negative, neutral, or mixed
- Provides confidence scores (0-1)
- Confidence score helps prioritize results

### Key Phrase Extraction
- Identifies important phrases in the text
- Helps understand what people are talking about
- Used for trending topics

### Named Entity Recognition
- Identifies entities like organizations, persons, locations
- Helps match sentiment to specific companies, products, features
- Critical for connecting feedback to specific entities

## What Happens If Azure AI Fails?

BurnBook has built-in fallback behavior:

1. **Graceful Degradation**: If Azure AI is unavailable, the app uses mock sentiment analysis
2. **Mock Analysis**: Uses keyword-based sentiment detection
3. **No Data Loss**: All Reddit posts are still fetched and stored
4. **Logging**: Check console logs to see if Azure AI is being used or mocked

## Troubleshooting

### "403 Forbidden" Error
- Check your API key is correct
- Verify the key hasn't expired (Keys rotate periodically)
- Ensure you're using the correct region endpoint

### "404 Not Found" Error
- Verify the endpoint is correct
- Check that Language Service resource exists in that region
- Ensure you're not including operation paths in the endpoint

### "Rate Limit Exceeded" Error
- You've hit the throttle limit (default: 10 requests/second)
- Consider upgrading your Language Service tier
- Implement request queuing

### "Unauthorized" Error
- API key might be invalid
- Try regenerating keys in Azure Portal
- Make sure you're using the right key (Key 1 or Key 2)

## Performance Tips

1. **Batch Processing**: The edge function processes multiple posts
2. **Text Limits**: Azure AI has a 5120 character limit per request
3. **Caching**: Consider caching sentiment for identical posts
4. **Rate Limiting**: Monitor your request rate to avoid throttling

## Cost Estimation

As of 2024, Azure Language Service pricing (Standard S tier):
- **Free tier**: 5,000 records/month
- **Standard tier**: ~$10-25 per 1M records

For typical use with 10-100 posts analyzed per day:
- Estimated monthly cost: **$1-5** if within free tier
- Cost increases if you exceed free tier limits

## Next Steps

1. ✅ Create Language Service resource
2. ✅ Get API credentials
3. ✅ Update `.env.local`
4. ✅ Deploy edge function to Supabase
5. ✅ Test with Reddit URLs
6. ✅ Monitor Azure Portal for usage

## Additional Resources

- Azure Language Service: https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/
- Azure AI Foundry: https://ai.azure.com
- API Reference: https://learn.microsoft.com/en-us/rest/api/cognitiveservices/language/analyze-text/analyze
- Pricing: https://azure.microsoft.com/en-us/pricing/details/cognitive-services/language-service/

## Limitations

Azure Language Service limitations:
- Maximum 5,120 characters per document
- Maximum 1,000 documents per API call
- Language detection required for sentiment (supports 120+ languages)
- Rate limits based on tier (10 req/sec for Standard)

The BurnBook edge function handles these automatically:
- Splits large posts into chunks if needed
- Batches multiple posts efficiently
- Falls back to mock if limits exceeded
