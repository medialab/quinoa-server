import validator from 'validator';

export default (resource) => {
  const {metadata, data} = resource;
  let validation = {};
  switch (metadata.type) {
    case 'image':
      if (!data.base64 || !validator.isDataURI(data.base64)) {
        validation = {
          error: 'Invalid image data'
        };
      }
      break;
    case 'table':
      if (!data.json || !Array.isArray(data.json)) {
        validation = {
          error: 'Invalid csv data'
        };
      }
      break;
    default:
      break;
  }
  return validation;
}
