# Deployment Guide for Hostinger

**Target URL**: `http://crm.financiegroup.com/` (Subdomain root)

## Prerequisites
- Acceso al panel de control de Hostinger (File Manager o FTP).
- Proyecto construido localmente (`dist/` folder).

## Steps

1. **Build the Project**
   Run the following command in your local terminal:
   ```bash
   npm run build
   ```
   This creates a `dist` folder with the static assets.

2. **Upload to Hostinger**
   - Navigate to the `public_html` folder of the subdomain `crm.financiegroup.com`.
   - **IMPORTANT**: Ensure the directory is empty (or delete old files).
   - Upload the **CONTENTS** of the `dist` folder (not the folder itself).
     - You should see `index.html`, `assets/`, and `.htaccess` in the root of the subdomain folder.

3. **Verify .htaccess**
   - Ensure the `.htaccess` file is present. It is critical for React Router to work (handles page refreshes).
   - Content:
     ```apache
     <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
     </IfModule>
     ```

4. **Environment Variables**
   - Since this is a static build, environment variables (`VITE_SUPABASE_URL`, etc.) are **baked into the build**.
   - If you change `.env`, you must rebuild and re-upload.

## Troubleshooting
- **404 on Refresh**: Check if `.htaccess` exists and mod_rewrite is enabled (standard on Hostinger).
- **White Screen**: Check browser console for JS errors. Verify `VITE_SUPABASE_URL` was correct during build.
