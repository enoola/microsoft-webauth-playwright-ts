import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';

interface LoggerOptions {
    level?: string;
}

class Logger {
    private months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    private logFilePath: string;
    private dumpSubDir: string;

    constructor() {
        this.logFilePath = path.resolve(__dirname, '../logs/app.log');

        // Initialize dump directory name once per execution
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');

        // Format: YYYY-MM-DD_HHhMM
        this.dumpSubDir = `${yyyy}-${mm}-${dd}_${hh}h${min}`;

        // Ensure logs directory exists
        fs.ensureDirSync(path.dirname(this.logFilePath));
    }

    private _getTimestamp(): string {
        const now = new Date();
        const month = this.months[now.getMonth()];
        const day = String(now.getDate()).padStart(2, '0');
        const time = now.toTimeString().split(' ')[0];
        return `[${month} ${day} ${time}]`;
    }

    /**
     * Returns the absolute path to the current session's dump directory.
     * Ensures the directory exists.
     */
    async getDumpDir(): Promise<string> {
        const dumpDir = path.resolve(__dirname, '../logs/dumps', this.dumpSubDir);
        await fs.ensureDir(dumpDir);
        return dumpDir;
    }

    /**
     * Returns a user-friendly relative path for logging.
     */
    getDumpDisplayPath(): string {
        return `logs/dumps/${this.dumpSubDir}`;
    }

    private _stripColors(str: string): string {
        // eslint-disable-next-line no-control-regex
        return str.replace(/\u001b\[[0-9;]*m/g, '');
    }

    private _formatMessage(level: string, message: string | object, colorFunc: (m: string) => string = (m) => m): string {
        const timestamp = this._getTimestamp();
        const coloredTimestamp = chalk.gray(timestamp);
        const levelTag = `[${level}]`;
        const coloredLevelTag = colorFunc(levelTag);

        // Handle multi-line messages
        let formattedMessage = '';
        if (typeof message === 'string' && message.includes('\n')) {
            formattedMessage = message.split('\n').map(line => `${coloredTimestamp} ${coloredLevelTag} ${line}`).join('\n');
        } else if (typeof message !== 'string') {
            // Handle objects/errors
            try {
                const stringified = JSON.stringify(message, null, 2);
                formattedMessage = `${coloredTimestamp} ${coloredLevelTag} ${stringified}`;
            } catch (e) {
                formattedMessage = `${coloredTimestamp} ${coloredLevelTag} [Complex Object]`;
            }
        } else {
            formattedMessage = `${coloredTimestamp} ${coloredLevelTag} ${message}`;
        }

        // Write to log file (no colors)
        const plainTimestamp = timestamp;
        const plainLevelTag = levelTag;
        let plainMessage = '';

        if (typeof message === 'string' && message.includes('\n')) {
            plainMessage = message.split('\n').map(line => `${plainTimestamp} ${plainLevelTag} ${line}`).join('\n');
        } else if (typeof message !== 'string') {
            try {
                const stringified = JSON.stringify(message, null, 2);
                plainMessage = `${plainTimestamp} ${plainLevelTag} ${stringified}`;
            } catch (e) {
                plainMessage = `${plainTimestamp} ${plainLevelTag} [Complex Object]`;
            }
        } else {
            plainMessage = `${plainTimestamp} ${plainLevelTag} ${message}`;
        }

        // Append to log file
        fs.appendFileSync(this.logFilePath, plainMessage + '\n');

        return formattedMessage;
    }

    /**
     * Generic log method for programmatic use
     */
    log(level: string, message: string | object): void {
        const lv = (level || 'info').toLowerCase();
        if (this[lv as keyof Logger] && typeof this[lv as keyof Logger] === 'function') {
            (this[lv as keyof Logger] as (msg: string | object) => void)(message);
        } else {
            this.info(message);
        }
    }

    info(message: string | object): void {
        process.stdout.write(this._formatMessage('INFO', message, chalk.blue) + '\n');
    }

    warn(message: string | object): void {
        process.stdout.write(this._formatMessage('WARN', message, chalk.yellow) + '\n');
    }

    error(message: string | object, error: Error | null = null): void {
        process.stderr.write(this._formatMessage('ERROR', message, chalk.red) + '\n');
        if (error) {
            if (error.stack) {
                const stack = chalk.red(error.stack);
                process.stderr.write(stack + '\n');
                // Also write stack to file
                fs.appendFileSync(this.logFilePath, this._stripColors(stack) + '\n');
            } else {
                process.stderr.write(this._formatMessage('ERROR', error, chalk.red) + '\n');
            }
        }
    }

    success(message: string | object): void {
        process.stdout.write(this._formatMessage('SUCCESS', message, chalk.green) + '\n');
    }

    debug(message: string | object): void {
        process.stdout.write(this._formatMessage('DEBUG', message, chalk.gray) + '\n');
    }

    step(message: string | object): void {
        process.stdout.write(this._formatMessage('STEP', message, chalk.magenta) + '\n');
    }
}

export default new Logger();
