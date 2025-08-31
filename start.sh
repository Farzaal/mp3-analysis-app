#!/bin/bash

APP_NAME="We-Oversee-APIs"
LOG_FILE_PATH="/var/www/pm2-out.log" 
LOG_ERROR_FILE_PATH="/var/www/pm2-error.log"

if [ -f "$LOG_FILE_PATH" ]; then
    echo "File $LOG_FILE_PATH already exists."
else
    sudo touch "$LOG_FILE_PATH"
    echo "File $LOG_FILE_PATH created."
fi

if [ -f "$LOG_ERROR_FILE_PATH" ]; then
    echo "File $LOG_ERROR_FILE_PATH already exists."
else
    sudo touch "$LOG_ERROR_FILE_PATH"
    echo "File $LOG_ERROR_FILE_PATH created."
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null
then
    npm i pm2 -g
fi

# Check if the PM2 application is already running
if pm2 list | grep -q "$APP_NAME"
then
    echo "PM2 application '$APP_NAME' is already running."
else
    echo "PM2 application '$APP_NAME' is not running. Starting it now..."
    pm2 start ecosystem.config.js
fi