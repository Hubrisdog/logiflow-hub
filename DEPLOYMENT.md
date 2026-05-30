# LogiFlow Hub Deployment Guide 🪐

This guide covers deployment procedures for LogiFlow Hub (web application) and its related environments.

---

## ☁️ Deploy to Netlify (Recommended)

Netlify is the recommended static hosting platform for the LogiFlow Hub Single Page React Application.

### Step 1: Prepare the Build
Run the production build command locally to verify that there are no compilation errors:
```bash
npm run build
```
This bundles and compiles the React application under the `dist/` directory.

### Step 2: Continuous Deployment via GitHub
1. Go to your [Netlify Dashboard](https://www.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and authorize access to your repository `https://github.com/Hubrisdog/logiflow-hub`.
4. Configure the build parameters:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
5. Click **Deploy logiflow-hub**.

### Step 3: Configure Site Environment Variables
1. Inside your Netlify project settings, go to **Site configuration** > **Environment variables**.
2. Add the following keys mapping to your production Supabase database instance:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   ```
3. Trigger a redeploy to build the source code with the new variables injected.

---

## 🚀 Alternative: Deploying to Vercel

1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import the `logiflow-hub` repository.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables in the project settings.
4. Click **Deploy**. Vercel will automatically build the site from your main branch on every commit.

---

## 🐳 Deploying with Docker

If you need a containerized deployment, use this lightweight `Dockerfile` configuration:

```dockerfile
# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Nginx Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf Configuration
Ensure Nginx is configured to handle Single Page App routing redirects:
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

To run:
```bash
docker build -t logiflow-hub .
docker run -p 8080:80 logiflow-hub
```

---

## 🔐 Post-Deployment Checklist
- **Enable RLS:** Verify Row Level Security is active on all tables in Supabase.
- **CORS Configuration:** Configure allowed origins in your Supabase project dashboard to restrict data queries to your Netlify/Vercel domains.
- **Verify SSL:** Ensure all pages load over HTTPs to secure user auth credentials and camera streaming streams for barcode scanning.

---

Built with 🪐 by Hubris
