import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  VideoProject, VideoPlan, ensureStorage, projectDir, PROJECTS_DIR,
} from './config.js';

export function saveProject(project: VideoProject): void {
  const dir = projectDir(project.id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'videolane.json'), JSON.stringify(project, null, 2));
}

export function loadProject(projectId: string): VideoProject | null {
  const file = join(projectDir(projectId), 'videolane.json');
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function listProjects(): VideoProject[] {
  ensureStorage();
  if (!existsSync(PROJECTS_DIR)) return [];
  return readdirSync(PROJECTS_DIR)
    .map(id => loadProject(id))
    .filter((p): p is VideoProject => p !== null);
}

export function savePlan(plan: VideoPlan): void {
  const dir = projectDir(plan.projectId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'plan.json'), JSON.stringify(plan, null, 2));
}

export function loadPlan(projectId: string): VideoPlan | null {
  const file = join(projectDir(projectId), 'plan.json');
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function savePlanToFile(plan: VideoPlan, filePath: string): void {
  const dir = join(filePath, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(plan, null, 2));
}

export function loadPlanFromFile(filePath: string): VideoPlan {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}
