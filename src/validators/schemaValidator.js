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
  const dataSchema = resourceSchema.definitions[resource.metadata.type];
  const valid = validate(resourceSchema, resource).valid && validate(dataSchema, resource.data).valid;
  let errors;
  if (validate(resourceSchema, resource).errors || validate(dataSchema, resource.data).errors) {
    errors = validate(resourceSchema, resource).errors.length > 0 ?
      validate(resourceSchema, resource).errors : validate(dataSchema, resource.data).errors;
  }
  return {valid, errors};
};