import Ajv from 'ajv';

import storySchema from 'quinoa-schemas/story';

const ajv = new Ajv();
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

export const validate = (schema, data) => {
  const val = ajv.compile(schema);
  return {valid: val(data), errors: val.errors};
};

export default (story) => validate(storySchema, story);

// export const validateResource = story => validate(resourceSchema, resource);
