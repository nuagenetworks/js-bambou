import NUObject from 'service/NUObject';
import dateformat from 'dateformat';

const LogLevels = ["fatal", "error", "warn", "info", "debug", "trace"];

let _instance;

class _Logger extends NUObject {
    constructor(level, ...args) {
        super(...args);
        this.defineProperties({
            level: 3,
        });
        if (level && LogLevels[level]) {
            this.level = level;
        }
    }

    log(message) {
        if (this.level >= 4) {
            this._logToConsole(message);
        }
    }

    fatal(message) {
        this._logToConsole(message, 0);
    }

    error(message) {
        this._logToConsole(message, 1);
    }

    warn(message) {
        this._logToConsole(message, 2);
    }

    info(message) {
        this._logToConsole(message, 3);
    }

    debug(message) {
        this._logToConsole(message, 4);
    }

    trace(message) {
        this._logToConsole(message, 5);
    }

    _logToConsole(message, level) {
        if (typeof console !== "undefined")
        {
            const logLevel = level && LogLevels[level];

            const formattedMessage = `${dateformat(new Date(), "yyyy-mm-dd, HH:MM:ss.l")} [${logLevel || "debug"}] ${message}`;
            if (level && level <= this.level && logLevel && console[logLevel]){
                console[logLevel](formattedMessage);
            }
            else if (!level && console.log) {
                console.log(formattedMessage)
            }
        }
    }
}

const Logger = (level) => {
    if (! _instance ) {
        _instance = new _Logger(level);
    }
    return _instance;
}

export const getLogger = () => {
    if (!_instance) {
        return Logger();
    }
    return _instance;
}

export default Logger;
