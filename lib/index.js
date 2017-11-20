const { EOL } = require('os');
const { promisify } = require('util');
const { readFile, writeFile } = require('fs');
const minimist = require('minimist');

const promiseReadFile = promisify(readFile);
const promiseWriteFile = promisify(writeFile);

const SPORTS = {
  fencing: 'Fencing',
  football: 'Football',
}

const ENVIRONMENTS = {
  debug: 'Debug',
  release: 'Release',
  beta: 'Beta',
}

const HASHES = {
  '83CBBA201A601CBA00E9B192': {
    environment: ENVIRONMENTS.debug,
    sport: SPORTS.fencing,
  },
  '83CBBA211A601CBA00E9B192': {
    environment: ENVIRONMENTS.release,
    sport: SPORTS.fencing,
  },
  'B7DB35801F22BA0F00172193': {
    environment: ENVIRONMENTS.beta,
    sport: SPORTS.fencing,
  },
  '35B4C3E71F8E63ED00314C61': {
    environment: ENVIRONMENTS.debug,
    sport: SPORTS.football,
  },
  '35B4C4201F8E640F00314C61': {
    environment: ENVIRONMENTS.release,
    sport: SPORTS.football,
  },
  '35B4C4241F8E643000314C61': {
    environment: ENVIRONMENTS.beta,
    sport: SPORTS.football,
  },
}

const KEYS = Object.keys(HASHES);

const getKeyIfExists = (row) => {
  for (const key of KEYS) {
    if (row.includes(key)) {
      return key;
    }
  }
  return false;
};

const handleRow = (row, index) => {
  const key = getKeyIfExists(row);
  if (key) {
    return ({ row: getString(row), key, index });
  }
  return false;
}
const getFileName = () => {
  const { file } = minimist(process.argv.slice(2));
  if (!file) {
    return './ios/legends_react_native.xcodeproj/project.pbxproj';
  }
  return file;
}

const readPbxproj = async (text = '') => {
  try {
    return await promiseReadFile(getFileName(), { encoding: 'utf8' });
  } catch(e) {
    console.error('error', e);
    throw new Error(e);
  }
}

const writePbxproj = async (text = '') => {
  try {
    const file = await promiseWriteFile(getFileName(), text, { encoding: 'utf8' });
  } catch(e) {
    console.error('error', e);
    throw new Error(e);
  }
}

const getTarget = () => {
  const { fencing, football } = minimist(process.argv.slice(2));
  if (fencing) {
    return SPORTS.fencing;
  }
  if (football) {
    return SPORTS.football;
  }
  throw new Error('Remember to pass either --fencing or --football to what do you want to build')
}

const getString = (rowString) => rowString.split('*');

const moveToTarget = (mappedRows) => {
  const target = getTarget();
  const newMap = mappedRows.map(el => {
    const row = { ...el, row: [...el.row] };
    if (HASHES[el.key].sport === target) {
      row.row[1] = ` ${HASHES[el.key].sport} ${HASHES[el.key].environment} `;
      row.row = row.row.join('*');
    } else {
      row.row[1] = ` ${HASHES[el.key].environment} `;
      row.row = row.row.join('*');
    }
    return row;
  });
  return newMap;
}

const merge = (rowsToMap, splitted) => {
  const newSplitted = [...splitted];
  rowsToMap.forEach(row => {
    newSplitted[row.index] = row.row;
  })
  return newSplitted;
}

const start = async (terminalArguments) => {
  try {
    const file = await readPbxproj();
    const splitted = file.split(EOL);
    const mappedRows = splitted.map(handleRow).filter(el => !!el)
    const newMappedRows = moveToTarget(mappedRows);
    const mergedRows = merge(newMappedRows, splitted);
    await writePbxproj(mergedRows.join(EOL));
  } catch (e) {
    console.log('error', e)
    throw new Error(e);
  }
}

module.exports = start

