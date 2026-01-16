/**
 * Placeholder for MongoDB reporting.
 * We'll implement aggregation pipelines that match the SQL view outputs.
 */
export async function queryView(_viewName, _filters = {}) {
  throw new Error('Mongo reporting provider is not implemented yet.');
}

export async function listProperties() {
  return [];
}

export async function listBoardMembers() {
  return [];
}
