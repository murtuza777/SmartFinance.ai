# Gemini API Setup Guide

This guide will help you set up the Google Gemini API key for the AI Advisor feature.

## Step 1: Get Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to [https://ai.google.dev/](https://ai.google.dev/)
   - Sign in with your Google account

2. **Create an API Key**
   - Click the **"Get API Key"** button
   - Choose to create the API key in a new Google Cloud project or an existing one
   - After creation, your API key will be displayed
   - **Copy the API key** (it starts with `AIza...`)

## Step 2: Configure the API Key

1. **Create `.env.local` file** (if it doesn't exist)
   - In the project root directory, create a file named `.env.local`

2. **Add your API key**
   - Open `.env.local` in a text editor
   - Add the following line:
     ```
     NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
     ```
   - Replace `your_api_key_here` with the API key you copied from Google AI Studio
   - Example:
     ```
     NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyAWtgx0fdweNhV6Rf_JZRF317bqVammyDc
     ```

3. **Save the file**

## Step 3: Restart Your Development Server

1. **Stop the current server** (if running)
   - Press `Ctrl+C` in the terminal where the server is running

2. **Start the server again**
   ```bash
   npm run dev
   ```

## Step 4: Test the AI Advisor

1. Navigate to the dashboard in your application
2. Open the AI Advisor feature
3. Try asking a question like: "How can I save money as a student?"
4. If configured correctly, you should receive a response from the Gemini AI

## Troubleshooting

### Error: "Gemini API key is not configured"
- Make sure you created the `.env.local` file in the project root
- Verify the variable name is exactly: `NEXT_PUBLIC_GEMINI_API_KEY`
- Ensure there are no spaces around the `=` sign
- Restart your development server after adding the key

### Error: "Invalid API key format"
- Gemini API keys should start with `AIza`
- They are typically 39 characters long
- Make sure you copied the entire key without any extra spaces

### Error: "Authentication error" (401/403)
- Verify your API key is active in Google AI Studio
- Check that you haven't exceeded your API quota
- Ensure the key hasn't been revoked or deleted

### API Key Security
- **Never commit** `.env.local` to version control (it's already in `.gitignore`)
- **Never share** your API key publicly
- For production, set the environment variable in your hosting platform's settings

## Additional Resources

- [Google AI Studio Documentation](https://ai.google.dev/tutorials/setup)
- [Gemini API Reference](https://ai.google.dev/api)
- [API Key Best Practices](https://ai.google.dev/gemini-api/docs/api-key)

## Model Information

The AI Advisor uses the following Gemini models (in order of preference):
1. `gemini-2.5-pro` - Latest and most capable model with advanced reasoning
2. `gemini-1.5-pro` - Fallback to 1.5 Pro
3. `gemini-1.5-flash` - Faster, good for most tasks
4. `gemini-pro` - Fallback to older model

The system will automatically try these models if one is unavailable.

### Gemini 2.5 Pro Capabilities
- **Input tokens**: Up to 1,048,576 tokens
- **Output tokens**: Up to 65,536 tokens (configured to 8,192 for responses)
- **Features**: Structured outputs, caching, function calling, code execution, search grounding
- **Multimodal**: Supports text, images, audio, video, and PDF inputs

