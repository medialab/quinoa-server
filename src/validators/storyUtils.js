export default (story) => {
  // delete unused notes
  const {sections} = story;
  const cleanedSections = Object.keys(sections).reduce((result, sectionId) => {
    const newSection = {
      ...sections[sectionId],
      notes: sections[sectionId].notesOrder.reduce((res, noteId) => ({
        ...res,
        [noteId]: sections[sectionId].notes[noteId]
      }), {})
    };

    return {
      ...result,
      [sectionId]: newSection
    };
  }, {});

  const notesList = Object.keys(cleanedSections)
  .reduce((note, sectionId) => [
      ...note,
      ...Object.keys(cleanedSections[sectionId].notes).map(noteId => cleanedSections[sectionId].notes[noteId]),
    ], []);
  const notesContents = notesList.filter(n => n).map((note) => note.contents);
  const entityList = Object.keys(story.sections)
  .reduce((contents, sectionId) => [
      ...contents,
      cleanedSections[sectionId].contents,
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

  const contextualizationsEntityList = entityList.filter((entity) => entity.type === 'INLINE_ASSET' || entity.type === 'BLOCK_ASSET').map(entity => entity.data.asset.id);

  const cleanedContexualizations = Object.keys(story.contextualizations).filter(id => {
      return contextualizationsEntityList.indexOf(id) !== -1;
    })
    .reduce((final, id) => ({
      ...final,
      [id]: story.contextualizations[id],
    }), {});

  const contexualizationsContexualizerList = Object.keys(cleanedContexualizations).map(id => cleanedContexualizations[id].contextualizerId);
  const cleanedContextualizers = Object.keys(story.contextualizers).filter(id => {
    return contexualizationsContexualizerList.indexOf(id) !== -1;
    })
    .reduce((final, id) => ({
      ...final,
      [id]: story.contextualizers[id],
    }), {});

  return {
    ...story,
    sections: cleanedSections,
    contextualizations: cleanedContexualizations,
    contextualizers: cleanedContextualizers
  };
}