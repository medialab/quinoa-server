import {difference, uniq} from 'lodash';

export default (story) => {
  const notesList = Object.keys(story.sections)
  .reduce((note, sectionId) => [
      ...note,
      ...Object.keys(story.sections[sectionId].notes).map(noteId => story.sections[sectionId].notes[noteId]),
    ], []);
  const notesContents = notesList.map((note) => note.contents);
  const entityList = Object.keys(story.sections)
  .reduce((contents, sectionId) => [
      ...contents,
      story.sections[sectionId].contents,
    ], notesContents)
  .reduce((entities, contents) =>
    [
      ...entities,
      ...Object.keys(contents && contents.entityMap || {}).reduce((localEntities, entityId) => {
        const entity = contents.entityMap[entityId];
        return [...localEntities, entity];
      }, [])
    ],
  []);
  const notesEntityList = entityList.filter((entity) => entity.type === 'NOTE_POINTER').map(entity => entity.data.noteId);
  const contextualizationsEntityList = entityList.filter((entity) => entity.type === 'INLINE_ASSET' || entity.type === 'BLOCK_ASSET').map(entity => entity.data.asset.id);

  const contextualizationsResourceList = Object.keys(story.contextualizations).map(id => story.contextualizations[id].resourceId);
  const contexualizationsContexualizerList = uniq(Object.keys(story.contextualizations).map(id => story.contextualizations[id].contextualizerId));
  const errors = [];
  let validation = {valid: true};
  //check if notesEntity valid
  if (difference(notesEntityList, notesList.map(entity => entity.id)).length !== 0) {
    errors.push('invalid notes entities');
    validation = {
      valid: false,
      errors,
    };
  }
  //check if contextualizationsEntity valid
  if (difference(contextualizationsEntityList, Object.keys(story.contextualizations)).length !== 0) {
    errors.push('invalid contextualizations entities');
    validation = {
      valid: false,
      errors,
    };
  }
  // check if contextualizations - resource valid
  if (difference(contextualizationsResourceList, Object.keys(story.resources)).length !== 0) {
    errors.push('invalid contextualizations resources');
    validation = {
      valid: false,
      errors,
    };
  }
  // check if contextualizations - contextualizers valid
  if (contexualizationsContexualizerList.find(contextualizerId => story.contextualizers[contextualizerId] === undefined) !== undefined) {
    errors.push('invalid contextualizations contextualizers');
    validation = {
      valid: false,
      errors
    };
  }
  
  return validation;
};