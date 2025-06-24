#!/bin/bash

# Secure Environment Setup Script
# This script helps set up environment variables securely

echo "🔐 Secure Environment Setup for Inventory POS"
echo "=============================================="
echo ""
echo "⚠️  IMPORTANT SECURITY NOTICE:"
echo "   - Never commit API keys or secrets to version control"
echo "   - Always use environment variables for sensitive data"
echo "   - Rotate your API keys if they were exposed"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📄 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created from .env.example"
else
    echo "📄 .env.local already exists"
fi

echo ""
echo "🔑 Environment Variables Setup:"
echo "------------------------------"
echo ""
echo "1. Supabase Configuration:"
echo "   - Go to your Supabase project dashboard"
echo "   - Navigate to Settings > API"
echo "   - Copy your project URL and anon key"
echo "   - For service role key, use it only for server-side operations"
echo ""
echo "2. NextAuth Configuration:"
echo "   - Generate a secure secret: openssl rand -base64 32"
echo "   - Set NEXTAUTH_SECRET in your .env.local"
echo ""
echo "3. Resend API (for emails):"
echo "   - Sign up at resend.com"
echo "   - Generate an API key"
echo "   - Set RESEND_API_KEY in your .env.local"
echo ""
echo "4. Database Configuration:"
echo "   - Set DATABASE_URL for your PostgreSQL connection"
echo "   - Set DIRECT_URL if using connection pooling"
echo ""

# Check if environment variables are set
echo "🔍 Checking current environment variables:"
echo "----------------------------------------"

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXTAUTH_SECRET"
    "DATABASE_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var - NOT SET"
    else
        # Show only first few characters for security
        value="${!var}"
        masked="${value:0:10}..."
        echo "✅ $var - SET ($masked)"
    fi
done

echo ""
echo "📝 Next Steps:"
echo "1. Edit .env.local with your actual values"
echo "2. Never commit .env.local to version control"
echo "3. Use different API keys for development and production"
echo "4. Regularly rotate your API keys"
echo ""
echo "🚀 Ready to start development!"
