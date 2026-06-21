#!/usr/bin/env node

import { program } from 'commander';
import logger from './utils/logger';
import { login, checkAuth, getAuthMeta, logout } from './auth';

program
    .name('webauth')
    .description('Microsoft web authentication via Playwright — extracted from MSOneNote Exporter')
    .version('1.0.0');

program
    .command('login')
    .description('Authenticate with Microsoft Account')
    .option('--email <email>', 'Microsoft account email')
    .option('--password <password>', 'Microsoft account password')
    .option('--notheadless', 'Run in visible browser mode for debugging')
    .option('--dodump', 'Dump HTML content to files for debugging')
    .action(async (options) => {
        await login(options);
    });

program
    .command('check')
    .description('Check if authenticated')
    .action(async () => {
        const isAuth = await checkAuth();
        if (isAuth) {
            logger.success('Authentication file found. You are authenticated.');
            const meta = await getAuthMeta();
            if (meta && meta.email) {
                const loginTime = new Date(meta.loginTime).toLocaleString();
                logger.info(`Logged in as: ${meta.email}`);
                logger.debug(`Session started at: ${loginTime}`);
            }
        } else {
            logger.error('Authentication file NOT found or invalid. Run "login" first.');
        }
    });

program
    .command('logout')
    .description('Clear authentication state')
    .action(async () => {
        await logout();
        logger.success('Logged out successfully. Authentication state cleared.');
    });

program.parse();
