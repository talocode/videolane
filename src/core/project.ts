import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  VideoProject, VideoPlan, createDefaultProject, createDefaultPlan,
  ensureStorage, projectDir,
} from './config.js';
import { saveProject, savePlan } from './storage.js';

export interface InitProjectInput {
  name: string;
  template?: string;
  outDir?: string;
}

export function initProject(input: InitProjectInput): {
  project: VideoProject;
  plan: VideoPlan;
  dir: string;
} {
  ensureStorage();

  const dir = input.outDir || projectDir(input.name.toLowerCase().replace(/\s+/g, '-'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const project = createDefaultProject(input.name, dir);
  project.template = input.template;
  project.status = 'created';

  const plan = createDefaultPlan(project.id, input.name);

  saveProject(project);
  savePlan(plan);

  const planFile = join(dir, 'plan.json');
  writeFileSync(planFile, JSON.stringify(plan, null, 2));

  return { project, plan, dir };
}

export function createProject(input: InitProjectInput): {
  project: VideoProject;
  plan: VideoPlan;
  dir: string;
} {
  return initProject(input);
}
