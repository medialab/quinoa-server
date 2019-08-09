/**
 * this script launches the temp folder cleaning each day
 */

const chron = new require("chron")();
const cleanTemp = require('./cleanTempFolders');

const DAY_IN_SECONDS = 3600 * 24;

chron.add(DAY_IN_SECONDS, cleanTemp);