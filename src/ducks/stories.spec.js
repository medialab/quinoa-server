/**
 * This module provides unit tests for the stories duck
 */

import expect from 'expect';

import reducer, {
  UPDATE_SECTIONS_ORDER,
  CREATE_SECTION,
  DELETE_SECTION,
  DELETE_RESOURCE,
} from '../ducks/stories';

/**
 * * TESTING - Reducers
 */

describe( 'story reducer test', () => {
  describe( 'UPDATE_SECTIONS_ORDER action', () => {
    const mockState = {
      stories: {
        storyOne: {
          sectionsOrder: [ 'a', 'b', 'c', 'd' ]
        }
      }
    };
    const baseAction = {
      type: UPDATE_SECTIONS_ORDER,
      payload: {},
    };

    it( 'should successfully update sections order in normal cases', () => {
      const providedSectionsOrder = [ 'b', 'a', 'c', 'd' ];
      const action = {
        ...baseAction,
        payload: {
          storyId: 'storyOne',
          sectionsOrder: providedSectionsOrder
        }
      };
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sectionsOrder ).toEqual( providedSectionsOrder );
    } );
    it( 'should successfully update sections order after a section was deleted', () => {
      const providedSectionsOrder = [ 'b', 'a', 'c', 'e', 'd' ];
      const expectedSectionsOrder = [ 'b', 'a', 'c', 'd' ];
      const action = {
        ...baseAction,
        payload: {
          storyId: 'storyOne',
          sectionsOrder: providedSectionsOrder
        }
      };

      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sectionsOrder ).toEqual( expectedSectionsOrder );
    } );
    it( 'should successfully update sections order after a section was added', () => {
      const providedSectionsOrder = [ 'b', 'a', 'c' ];
      const expectedSectionsOrder = [ 'b', 'a', 'c', 'd' ];
      const action = {
        ...baseAction,
        payload: {
          storyId: 'storyOne',
          sectionsOrder: providedSectionsOrder
        }
      };
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sectionsOrder ).toEqual( expectedSectionsOrder );
    } );

  } );

  describe( 'CREATE_SECTION action', () => {
    const mockState = {
      stories: {
        storyOne: {
          sections: {
            a: {},
            b: {},
            c: {},
            d: {},
          },
          sectionsOrder: [ 'a', 'b', 'c', 'd' ]
        }
      }
    };
    const baseAction = {
      type: CREATE_SECTION,
      payload: {},
    };

    it( 'a section was added in summary view, section should be appended in section orders', () => {
      const action = {
        ...baseAction,
        payload: {
          storyId: 'storyOne',
          sectionId: 'e',
          section: {},
          sectionIndex: 4
        }
      }
      const expectedSectionsOrder = [ 'a', 'b', 'c', 'd', 'e' ];
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sectionsOrder ).toEqual( expectedSectionsOrder );
    } );

    it( 'a section was added in summary view, section should be appended in sections', () => {
      const action = {
        ...baseAction,
        payload: {
          storyId: 'storyOne',
          sectionId: 'e',
          section: {},
          sectionIndex: 4
        }
      }
      const expectedSections = {
        a: {},
        b: {},
        c: {},
        d: {},
        e: {}
      };
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sections ).toEqual( expectedSections );
    } );

    it( 'a section was added in section view, section should be inserted in section orders', () => {
      const action = {
        ...baseAction,
        payload: {
          storyId: 'storyOne',
          sectionId: 'e',
          section: {},
          sectionIndex: 2
        }
      }
      const expectedSectionsOrder = [ 'a', 'b', 'e', 'c', 'd' ];
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sectionsOrder ).toEqual( expectedSectionsOrder );
    } );

    it( 'a section was added in section view, section should be inserted in sections', () => {
      const action = {
        ...baseAction,
        payload: {
          storyId: 'storyOne',
          sectionId: 'e',
          section: {},
          sectionIndex: 2
        }
      }
      const expectedSections = {
        a: {},
        b: {},
        e: {},
        c: {},
        d: {},
      };
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sections ).toEqual( expectedSections );
    } );
  } );

  describe( 'DELETE_SECTION action', () => {
    const mockState = {
      stories: {
        storyOne: {
          sections: {
            a: {},
            b: {},
            c: {},
            d: {},
          },
          sectionsOrder: [ 'a', 'b', 'c', 'd' ],
          contextualizations: {
            ctxtionOne: {
              id: 'ctxtionOne',
              resourceId: 'resourceOne',
              contextualizerId: 'ctxlizerOne',
              sectionId: 'b'
            },
          },
          contextualizers: {
            ctxlizerOne: {
              id: 'ctxlizerOne',
              type: 'image'
            }
          }
        }
      }
    };
    const action = {
      type: DELETE_SECTION,
      payload: {
        storyId: 'storyOne',
        sectionId: 'b'
      },
    };

    it( 'a section was delete, section order should be updated', () => {
      const expectedSectionsOrder = [ 'a', 'c', 'd' ];
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sectionsOrder ).toEqual( expectedSectionsOrder );
    } );

    it( 'a section was delete, sections should be updated', () => {
      const expectedSections = {
        a: {},
        c: {},
        d: {}
      };
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.sections ).toEqual( expectedSections );
    } );

    it( 'a section was delete, contextualizations should be updated', () => {
      const expectedContextualizations = {};
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.contextualizations ).toEqual( expectedContextualizations );
    } );

    it( 'a section was delete, contextualizers should be deleted', () => {
      const expectedContextualizers = {};
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.contextualizers ).toEqual( expectedContextualizers );
    } );
  } );

  describe( 'DELETE_RESOURCE action', () => {
    const mockState = {
      stories: {
        storyOne: {
          resources: {
            resourceOne: {}
          },
          contextualizations: {
            ctxtionOne: {
              id: 'ctxtionOne',
              resourceId: 'resourceOne',
              contextualizerId: 'ctxlizerOne',
              sectionId: 'a'
            }
          },
          contextualizers: {
            ctxlizerOne: {
              id: 'ctxlizerOne',
              type: 'image'
            }
          }
        }
      }
    };

    const action = {
      type: DELETE_RESOURCE,
      payload: {
        storyId: 'storyOne',
        resourceId: 'resourceOne'
      }
    };

    it( 'a resource was delete, contextualizations should be updated', () => {
      const expectedContextualizations = {};
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.contextualizations ).toEqual( expectedContextualizations );
    } );

    it( 'a resource was delete, contextualizers should be updated', () => {
      const expectedContextualizers = {};
      const resultState = reducer( mockState, action );
      expect( resultState.stories.storyOne.contextualizers ).toEqual( expectedContextualizers );
    } );
  } );
} );