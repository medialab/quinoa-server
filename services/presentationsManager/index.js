/**
 * This module handle Create-Read-Update-Delete operations
 * on locally stored presentations
 * @module services/presentationsManager
 */
 
const presentationsPath = '../../data/presentations/';

/**
 * Fetches and returns all presentations stored locally
 * @param {function} filter - (optional) function to use if presentations are supposed to be filtered
 * @param {function} callback - callbacks an error and an object with keys as presentations id/filenamebase and values as json representations of the presentations
 */
export function getPresentations (filter, callback) {

}

/**
 * Fetches and returns a specific presentation
 * @param {function} callback - callbacks an error and the resulting presentation json representation
 */
export function getPresentation (id, callback) {

}

/**
 * Creates a new presentation
 * @param {function} callback - callbacks an error and an object containing one key (the id of the new presentation) attached to the resulting presentation json representation
 */
export function createPresentation (presentation, callback) {

}

/**
 * Updates a specific presentation
 * @param {function} callback - callbacks an error and the updated presentation json representation
 */
export function updatePresentation (id, presentation, callback) {

}

/**
 * Deletes a specific presentation
 * @param {function} callback - callbacks an error
 */
export function deletePresentation (id, callback) {

}