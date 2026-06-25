import Workspace from '../models/Workspace.js';

/**
 * Returns the workspace if the user is a member, otherwise null.
 * Centralised so every route and socket event enforces membership the same way.
 */
export async function getMemberWorkspace(workspaceId, userId) {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return null;
  const isMember = ws.members.some((m) => m.equals(userId));
  return isMember ? ws : null;
}
