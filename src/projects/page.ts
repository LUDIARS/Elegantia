import type { LocalProject } from '../../shared/local.js';
export function projectPage(projects: LocalProject[], updates: Map<string, number>, offset: number): { projects: LocalProject[]; nextOffset: number | null } {
  const sorted = projects.map(project => ({ ...project, updatedAt: Math.max(project.updatedAt, updates.get(project.project) ?? 0) }))
    .sort((a, b) => b.updatedAt - a.updatedAt || a.project.localeCompare(b.project));
  return { projects: sorted.slice(offset, offset + 10), nextOffset: offset + 10 < sorted.length ? offset + 10 : null };
}
