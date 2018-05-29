import Ajv from 'ajv';

import storySchema from './schemas/story.json';
import resourceSchema from './schemas/resource.json';

const ajv = new Ajv();
// ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

export const validate = (schema, data) => {
  const val = ajv.compile(schema);
  return {valid: val(data), errors: val.errors};
};

export const validateStory = story => validate(storySchema, story);

export const validateResource = story => validate(resourceSchema, story);
