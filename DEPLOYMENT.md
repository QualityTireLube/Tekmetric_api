# Deployment Guide

Guide for deploying the Tekmetric API Integration to production.

## Pre-Deployment Checklist

- [ ] Update `.env` with production credentials
- [ ] Change `TEKMETRIC_ENVIRONMENT` to production URL
- [ ] Update `FRONTEND_URL` to production frontend URL
- [ ] Build and test the application locally
- [ ] Review security settings
- [ ] Set up monitoring and logging

---

## Backend Deployment

### Option 1: Heroku

1. **Install Heroku CLI**
   ```bash
   brew install heroku/brew/heroku  # macOS
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-tekmetric-api
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set TEKMETRIC_CLIENT_ID=your_client_id
   heroku config:set TEKMETRIC_CLIENT_SECRET=your_client_secret
   heroku config:set TEKMETRIC_ENVIRONMENT=your_production_url
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://your-frontend-url.com
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Verify**
   ```bash
   heroku logs --tail
   heroku open
   ```

### Option 2: AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - t2.micro or larger
   - Configure security group (ports 22, 80, 443, 3001)

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

5. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd Tekmetric_api
   ```

6. **Install Dependencies**
   ```bash
   npm install
   ```

7. **Create .env File**
   ```bash
   nano .env
   # Add your production environment variables
   ```

8. **Start with PM2**
   ```bash
   pm2 start server/index.js --name tekmetric-api
   pm2 save
   pm2 startup
   ```

9. **Set up Nginx (Optional)**
   ```bash
   sudo apt-get install nginx
   ```

   Create Nginx config:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 3: DigitalOcean App Platform

1. **Connect Repository**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository

2. **Configure App**
   - Type: Web Service
   - Build Command: `npm install`
   - Run Command: `npm start`

3. **Set Environment Variables**
   - Add all variables from `.env`

4. **Deploy**
   - Click "Create Resources"

---

## Frontend Deployment

### Option 1: Netlify

1. **Build the Frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **Login**
   ```bash
   netlify login
   ```

4. **Deploy**
   ```bash
   cd client
   netlify deploy --prod --dir=build
   ```

5. **Set Environment Variable**
   - Go to Netlify dashboard
   - Site settings > Environment variables
   - Add: `REACT_APP_API_URL=https://your-backend-url.com/api`

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd client
   vercel --prod
   ```

3. **Set Environment Variable**
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter: https://your-backend-url.com/api
   ```

### Option 3: AWS S3 + CloudFront

1. **Build the Frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Create S3 Bucket**
   - Enable static website hosting
   - Set bucket policy for public read

3. **Upload Build Files**
   ```bash
   aws s3 sync build/ s3://your-bucket-name
   ```

4. **Create CloudFront Distribution**
   - Origin: Your S3 bucket
   - Default root object: index.html

5. **Update Environment**
   - Rebuild with production API URL
   - Create `.env.production` in client folder:
     ```
     REACT_APP_API_URL=https://your-backend-url.com/api
     ```

---

## Environment Variables

### Backend (.env)

```env
TEKMETRIC_CLIENT_ID=your_production_client_id
TEKMETRIC_CLIENT_SECRET=your_production_client_secret
TEKMETRIC_ENVIRONMENT=api.tekmetric.com
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (client/.env.production)

```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Using Cloudflare (Free)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full or Full Strict)
4. Automatic HTTPS rewrites

---

## Monitoring & Logging

### PM2 Monitoring

```bash
pm2 monit
pm2 logs
pm2 status
```

### Log Management

Consider using:
- **Papertrail**: Cloud-hosted log management
- **Loggly**: Log analysis
- **CloudWatch**: AWS native logging

### Uptime Monitoring

- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring
- **StatusCake**: Website monitoring

---

## Security Best Practices

1. **Use HTTPS Everywhere**
   - Backend and frontend must use HTTPS in production

2. **Secure Environment Variables**
   - Never commit `.env` to git
   - Use platform-specific secret management

3. **Update Dependencies**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Rate Limiting**
   - Already configured in the app
   - Consider adding Cloudflare for DDoS protection

5. **CORS Configuration**
   - Update `FRONTEND_URL` to production domain
   - Only allow your frontend domain

6. **Firewall Rules**
   - Only open necessary ports
   - Use security groups (AWS) or firewalls

---

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (AWS ALB, Nginx)
- Deploy multiple backend instances
- Share session state (Redis)

### Vertical Scaling

- Increase server resources
- Monitor CPU and memory usage
- Use PM2 cluster mode:
  ```bash
  pm2 start server/index.js -i max
  ```

### Database Caching

- Implement Redis for caching
- Cache Tekmetric API responses
- Set appropriate TTL values

---

## Backup & Recovery

1. **Code Backup**
   - Use Git with remote repository
   - Tag releases

2. **Environment Backup**
   - Document all environment variables
   - Store securely (1Password, AWS Secrets Manager)

3. **Database Backup** (if applicable)
   - Regular automated backups
   - Test restore procedures

---

## Rollback Procedure

### Heroku
```bash
heroku releases
heroku rollback v123
```

### PM2
```bash
git checkout previous-commit
npm install
pm2 restart tekmetric-api
```

### Netlify/Vercel
- Use dashboard to rollback to previous deployment

---

## Testing Production

1. **Health Check**
   ```bash
   curl https://your-backend-url.com/health
   ```

2. **Auth Test**
   ```bash
   curl https://your-backend-url.com/api/auth/test
   ```

3. **Frontend Test**
   - Open browser to your frontend URL
   - Test authentication
   - Verify all features work

---

## Troubleshooting

### Backend Not Starting

1. Check logs: `pm2 logs` or `heroku logs --tail`
2. Verify environment variables
3. Check port availability
4. Verify Node.js version

### CORS Errors

1. Verify `FRONTEND_URL` in backend `.env`
2. Check frontend is using correct API URL
3. Verify HTTPS on both frontend and backend

### API Authentication Failing

1. Verify Tekmetric credentials
2. Check if using production vs sandbox environment
3. Test credentials with Tekmetric directly

### High Response Times

1. Check server resources (CPU, memory)
2. Implement caching
3. Optimize API calls
4. Consider CDN for frontend

---

## Post-Deployment

- [ ] Monitor logs for errors
- [ ] Test all features
- [ ] Set up alerts for downtime
- [ ] Document the deployment
- [ ] Share URLs with team
- [ ] Set up automated backups
- [ ] Configure monitoring dashboards

---

## Support & Maintenance

### Regular Maintenance

- Update dependencies monthly
- Review logs weekly
- Monitor uptime daily
- Backup configurations

### Updates

```bash
# Update dependencies
npm update
cd client && npm update

# Test locally
npm run dev:all

# Deploy updates
git add .
git commit -m "Update dependencies"
git push
```

---

## Cost Estimates

### Heroku
- Hobby: $7/month (backend)
- Netlify: Free (frontend)
- **Total**: ~$7/month

### AWS
- EC2 t2.micro: ~$10/month
- S3 + CloudFront: ~$5/month
- **Total**: ~$15/month

### DigitalOcean
- Basic Droplet: $6/month
- App Platform: $5/month
- **Total**: ~$11/month

---

For questions or issues, refer to the main [README.md](./README.md) or contact your team lead.
