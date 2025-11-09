#!/bin/bash

# 🎯 GIRLBOSS BACKEND SETUP SCRIPT
# This script helps you set up the backend development environment

echo "🎀 Welcome to GirlBoss Backend Setup!"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file - please edit it with your API keys!"
    echo ""
    echo "🔑 You need to configure:"
    echo "  - MongoDB URI (from MongoDB Atlas)"
    echo "  - Snowflake credentials"
    echo "  - Databricks model URL and token"
    echo "  - Google Gemini API key"
    echo "  - ElevenLabs API key"
    echo "  - Twilio credentials (optional)"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Compile TypeScript
echo ""
echo "🔨 Compiling TypeScript..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your API keys"
    echo "2. Start development server: npm run dev"
    echo "3. Test health endpoint: curl http://localhost:4000/health"
    echo ""
else
    echo ""
    echo "⚠️  TypeScript compilation had warnings, but dependencies are installed."
    echo "You can still run: npm run dev"
    echo ""
fi
