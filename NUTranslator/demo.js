import { getLogger } from '../Logger';


const options = {
  '1': 'One',
  '2': 'Two',
};

export default (value) => {
  
  if(!options[value]) {
    getLogger().info('NUTranslator Value not found: ', value);
  }

  return options[value] ? options[value] : value;
};
