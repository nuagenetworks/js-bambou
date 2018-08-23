/**
 * Add respective translator file and register it inside translatorList object
 */

import demo from './demo';
import time_convert from './time';
import status from './status';

const translatorList = {
  demo,
  time_convert,
  status,
};

export default class NUTranslator {

  static translate(method, value) {

    if (!translatorList[method]) {
      return value;
    }

    return translatorList[method](value);
  }
}
