import Ajv from 'ajv';

import storySchema from 'quinoa-schemas/story';
import resourceSchema from 'quinoa-schemas/resource';

const ajv = new Ajv({logger: false});
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

export const validate = (schema, data) => {
  const val = ajv.compile(schema);
  return {valid: val(data), errors: val.errors};
};

export const validateStory = story => validate(storySchema, story);

export const validateResource = resource => {
  let validation = validate(resourceSchema, resource);
  if (validation.valid) {
    const dataSchema = resourceSchema.definitions[resource.metadata.type];
    validation = validate(dataSchema, resource.data);
  }
  return validation;
};