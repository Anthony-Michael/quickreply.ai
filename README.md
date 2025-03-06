# QuickReply AI

An AI-powered email response generator that helps you craft professional responses quickly and efficiently.

## Features

- 🔒 Secure authentication with Supabase
- ✉️ AI-powered email response generation
- 📊 Analytics dashboard
- 💳 Subscription management
- 🎨 Modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm 6.x or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quickreply-ai.git
cd quickreply-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
- Add your Supabase URL and anon key
- Add your OpenAI API key
- Add your Stripe publishable key (if using subscriptions)

5. Start the development server:
```bash
npm start
```

## Environment Variables

The following environment variables are required:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key (optional)
```

## Tech Stack

- React
- Supabase (Authentication & Database)
- OpenAI GPT
- Tailwind CSS
- React Router
- Stripe (Optional)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 