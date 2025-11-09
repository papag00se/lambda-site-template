
// Fix from https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            /** @type {Record<string, unknown>} */
            const alt = {};

            Object.getOwnPropertyNames(this).forEach((key) => {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });
}

/**
 * @enum {string}
 */
export const LogCategory = Object.freeze({
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    METRIC: 'METRIC',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL',
    NOTIFY: 'NOTIFY'
});

export class Logger {
    /** @type {string | undefined} */
    static application;

    /** @type {boolean} */
    static isInitialized = false;

    /**
     * Initialize logger metadata.
     * @returns {Promise<void>}
     */
    static async initialize() {
        if (process.env.NODE_ENV !== 'test') {
            if (!Logger.application) {
                const potentialName = await Environment.getPotentialApplicationName();
                if (!potentialName) {
                    throw new Error('Logger.application must be set!');
                }
                Logger.application = potentialName;
            }
        } else {
            Logger.application = 'TEST';
        }

        Logger.isInitialized = true;
    }

    /**
     * Emit a structured log entry.
     * @param {string | {
     *   message: string;
     *   category?: LogCategory;
     *   event?: string;
     *   milliseconds?: number;
     *   count?: number;
     *   dimensions?: string[];
     * }} args
     * @returns {void}
     */
    static log(args) {
        if (!Logger.isInitialized) {
            void Logger.initialize();
        }
        if (typeof args === 'string') {
            this.log_entry(LogCategory.INFO, args);
            return;
        }
        const { message, category, event, milliseconds, count, dimensions } = args;
        this.log_entry(category ?? LogCategory.INFO, message, event, milliseconds, count, dimensions);
    }

    /**
     * Internal log writer that normalizes payloads and routes to the console API.
     * @param {LogCategory} category
     * @param {string} message
     * @param {string} [event]
     * @param {number} [milliseconds]
     * @param {number} [count]
     * @param {string[]} [dimensions]
     * @returns {void}
     */
    static log_entry(category, message, event, milliseconds, count, dimensions) {
        const now = new Date().toISOString();
        // escape double quotes and already escaped escapes
        const safeMessage = message.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const log_event = event ? `, "event": "${event}"` : '';
        const log_milliseconds =
            milliseconds !== undefined && milliseconds !== null ? `, "milliseconds": ${milliseconds}` : '';
        const log_count = count !== undefined && count !== null ? `, "count": ${count}` : '';
        const log_dimensions =
            dimensions && Object.keys(dimensions).length ? `, "dimensions": ${JSON.stringify(dimensions)}` : '';
        let logFunc = console.log;
        switch (category) {
            case LogCategory.DEBUG:
                logFunc = console.debug;
                break;
            case LogCategory.WARN:
                logFunc = console.warn;
                break;
            case LogCategory.ERROR:
            case LogCategory.FATAL:
            case LogCategory.NOTIFY:
                logFunc = console.error;
                break;
        }
        // PLEASE KEEP THIS ALL ON ONE LINE SO LOGS AREN'T BROKEN UP
        logFunc(
            `{"application": "${Logger.application}", "category": "${category}", "message": "${safeMessage}"${log_event}, "timestamp": "${now}"${log_milliseconds}${log_count}${log_dimensions} }`
        );
        // PLEASE KEEP THIS ALL ON ONE LINE SO LOGS AREN'T BROKEN UP
    }
}

/**
 * @enum {string}
 */
export const ComputeEnvironment = Object.freeze({
    AWS_LAMBDA: 'aws_lambda',
    AWS_FARGATE: 'aws_fargate',
    AWS_EC2: 'aws_ec2',
    AWS_OTHER: 'aws_other',
    OTHER: 'other'
});

export class Environment {
    /**
     * @returns {Promise<ComputeEnvironment>}
     */
    static async getComputeEnvironment() {
        if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV) {
            return ComputeEnvironment.AWS_LAMBDA;
        }
        if (process.env.ECS_CLUSTER) {
            return ComputeEnvironment.AWS_FARGATE;
        }
        if (await Environment.getEc2InstanceName()) {
            return ComputeEnvironment.AWS_EC2;
        }
        if (process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION) {
            return ComputeEnvironment.AWS_OTHER;
        }
        return ComputeEnvironment.OTHER;
    }

    /**
     * @returns {Promise<{private: string | null, public: string | null} | null>}
     */
    static async getIpAddress() {
        let prv;
        let pub;
        if ((await Environment.getComputeEnvironment()) === ComputeEnvironment.AWS_EC2) {
            try {
                const response = await fetch('http://169.254.169.254/latest/meta-data/local-ipv4');
                prv = await response.text();
            } catch {
                // swallow
            }
            try {
                const response = await fetch('http://169.254.169.254/latest/meta-data/public-ipv4');
                pub = await response.text();
            } catch {
                // swallow
            }
            if (prv || pub) {
                return { private: prv ?? null, public: pub ?? null };
            }
        }
        if ((await Environment.getComputeEnvironment()) === ComputeEnvironment.AWS_EC2) {
            const metadata = await Environment.getEcsTaskMetaData();
            return { private: metadata?.Networks?.[0]?.IPv4Addresses?.[0] ?? null, public: null };
        }
        return null;
    }

    /**
     * @returns {Promise<string | null>}
     */
    static async getEc2InstanceName() {
        try {
            const response = await fetch('http://169.254.169.254/latest/meta-data/tags/instance/Name');
            return response.text();
        } catch (err) {
            // swallow
        }
        try {
            const response = await fetch('http://169.254.169.254/latest/meta-data/instance-id');
            return response.text();
        } catch (err) {
            // swallow
        }
        return null;
    }

    /**
     * @returns {Promise<{Networks?: Array<{IPv4Addresses?: string[]}>} | null>}
     */
    static async getEcsTaskMetaData() {
        try {
            const response = await fetch('http://169.254.170.2/v2/metadata');
            return await response.json();
        } catch (err) {
            return null;
        }
    }

    /**
     * @returns {Promise<string | null>}
     */
    static async getPotentialApplicationName() {
        if (process.env.APPLICATION_NAME) {
            return process.env.APPLICATION_NAME;
        }
        if ((await Environment.getComputeEnvironment()) === ComputeEnvironment.AWS_LAMBDA) {
            return process.env.AWS_LAMBDA_FUNCTION_NAME ?? null;
        }
        if ((await Environment.getComputeEnvironment()) === ComputeEnvironment.AWS_FARGATE) {
            return process.env.ECS_CLUSTER ?? null;
        }
        if ((await Environment.getComputeEnvironment()) === ComputeEnvironment.AWS_EC2) {
            const ec2_name = await Environment.getEc2InstanceName();
            if (ec2_name) {
                return ec2_name;
            }
        }
        try {
            return process.cwd();
        } catch {
            return null;
        }
    }
}
