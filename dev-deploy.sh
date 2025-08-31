        #!/bin/sh
ssh ubuntu@34.220.39.109 <<EOF
cd /var/www/html/we-oversee-backend
pwd
whoami
git reset --hard
git fetch
git pull origin dev
/home/ubuntu/.nvm/versions/node/v20.17.0/bin/npm ci
/home/ubuntu/.nvm/versions/node/v20.17.0/bin/npm run build:dev
/home/ubuntu/.nvm/versions/node/v20.17.0/bin/pm2 restart We-Oversee-APIs
EOF