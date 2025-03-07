# QuickReply AI

AI-powered email response generator that helps you craft professional responses quickly.

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/Anthony-Michael/quickreply-ai.git
cd quickreply-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with required environment variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:
```bash
npm start
```

## Available Scripts

- `npm start` - Run the development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run lint` - Check code style
- `npm run format` - Format code

## Tech Stack

- React
- Supabase (Authentication & Database)
- OpenAI GPT
- React Router
- Tailwind CSS

## Features

- 🔒 Secure authentication with Supabase
- ✉️ AI-powered email response generation
- 📊 Analytics dashboard
- 💳 Subscription management
- 🎨 Modern UI with Tailwind CSS

## Environment Variables

The following environment variables are required:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key (optional)
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 