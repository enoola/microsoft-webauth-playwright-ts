import * as path from 'path';

/**
 * Returns the directory where auth files (auth.json, auth-meta.json) are stored.
 * For this standalone CLI tool, we use the project root.
 */
function getUserDataDir(): string {
    return path.resolve(__dirname, '..');
}

const USER_DATA_DIR = getUserDataDir();

const AUTH_FILE = path.join(USER_DATA_DIR, 'auth.json');
const ONENOTE_URL = 'https://www.onenote.com/notebooks';

export { USER_DATA_DIR, AUTH_FILE, ONENOTE_URL };
