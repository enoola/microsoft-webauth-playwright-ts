import * as path from 'path';
import * as fs from 'fs-extra';

// Mock the modules before requiring auth
jest.mock('../src/config', () => ({
    AUTH_FILE: '/tmp/test-auth.json',
    ONENOTE_URL: 'https://www.onenote.com/notebooks',
    USER_DATA_DIR: '/tmp'
}));

jest.mock('../src/utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    debug: jest.fn(),
    step: jest.fn(),
    getDumpDir: async () => '/tmp/dumps',
    getDumpDisplayPath: () => 'logs/dumps/test'
}));

describe('Auth Module', () => {
    let auth: typeof import('../src/auth');

    beforeEach(() => {
        jest.clearAllMocks();
        // Clean up test files before each test
        fs.removeSync('/tmp/test-auth.json');
        fs.removeSync('/tmp/test-auth-meta.json');
    });

    afterAll(async () => {
        // Clean up after all tests
        fs.removeSync('/tmp/test-auth.json');
        fs.removeSync('/tmp/test-auth-meta.json');
    });

    describe('getAuthMeta', () => {
        it('should return null when no auth meta file exists', async () => {
            auth = await import('../src/auth');
            const meta = await auth.getAuthMeta();
            expect(meta).toBeNull();
        });

        it('should return metadata when auth meta file exists', async () => {
            // Create a test meta file
            await fs.writeJson('/tmp/test-auth-meta.json', {
                email: 'test@example.com',
                loginTime: new Date().toISOString()
            });

            auth = await import('../src/auth');
            const meta = await auth.getAuthMeta();

            expect(meta).toBeDefined();
            expect(meta?.email).toBe('test@example.com');
            expect(meta?.loginTime).toBeDefined();
        });
    });

    describe('logout', () => {
        it('should remove auth files', async () => {
            // Create test files
            await fs.writeJson('/tmp/test-auth.json', { test: true });
            await fs.writeJson('/tmp/test-auth-meta.json', { email: 'test@example.com' });

            auth = await import('../src/auth');
            await auth.logout();

            expect(await fs.pathExists('/tmp/test-auth.json')).toBe(false);
            expect(await fs.pathExists('/tmp/test-auth-meta.json')).toBe(false);
        });
    });

    describe('checkAuth', () => {
        it('should return false when no auth file exists', async () => {
            auth = await import('../src/auth');
            const isAuth = await auth.checkAuth();
            expect(isAuth).toBe(false);
        });

        it('should handle network errors gracefully', async () => {
            // Create a dummy auth file
            await fs.writeJson('/tmp/test-auth.json', { test: true });

            auth = await import('../src/auth');
            const isAuth = await auth.checkAuth();

            // Should return true on error (conservative approach)
            expect(isAuth).toBe(true);
        }, 10000);

    });

    describe('getAuthenticatedContext', () => {
        it('should throw error when no auth file exists', async () => {
            auth = await import('../src/auth');

            await expect(auth.getAuthenticatedContext(null as unknown as import('playwright').Browser)).rejects.toThrow(
                'No authentication state found. Please run "login" command first.'
            );
        });
    });
});
