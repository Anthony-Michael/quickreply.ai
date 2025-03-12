# Deployment Guide for ReplyRocket.io

This guide provides instructions for deploying the ReplyRocket.io application to various hosting platforms, allowing you to access it from a custom domain.

## Option 1: Deploy to Vercel (Recommended for Next.js)

Vercel is the platform created by the makers of Next.js and provides the simplest deployment experience.

1. Sign up for a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```
3. From your project directory, run:
   ```
   vercel
   ```
4. Follow the prompts to link your project to your Vercel account
5. Once deployed, you can add a custom domain in the Vercel dashboard

### Environment Variables

Make sure to set these environment variables in the Vercel dashboard:

- `NEXT_PUBLIC_DEVELOPMENT_MODE=true` (For testing with mock data)

## Option 2: Deploy to Netlify

1. Sign up for a Netlify account at [netlify.com](https://netlify.com)
2. Create a `netlify.toml` file in your project root:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [build.environment]
     NEXT_PUBLIC_DEVELOPMENT_MODE = "true"
   ```
3. Deploy using the Netlify CLI:
   ```
   npm install -g netlify-cli
   netlify deploy
   ```
4. Or connect your GitHub repository through the Netlify dashboard

## Option 3: Manual Deployment to Your Server

If you have your own hosting server:

1. Build the application:
   ```
   npm run build
   ```
2. The build output will be in the `.next` directory
3. Transfer the files to your server
4. Install Node.js on your server
5. Run the application:
   ```
   npm start
   ```
6. Configure your web server (Nginx, Apache) to proxy requests to the Node.js server

## Accessing Mock Pages

After deployment, you can access the mock pages at:

- Dashboard: `https://your-domain.com/mock`
- Email Composer: `https://your-domain.com/mock/compose`
- Profile: `https://your-domain.com/mock/profile`
- Subscription: `https://your-domain.com/mock/subscription`

## Troubleshooting

- If you encounter issues with the build, ensure all dependencies are correctly installed
- For authentication issues, make sure the development mode is properly enabled through environment variables
- If you're using a CDN or reverse proxy, ensure it's properly configured to handle Next.js routing 