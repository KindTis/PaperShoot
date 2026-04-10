import type { StageConfig } from '../contracts';
import { stage01 } from './stage01';
import { stage02 } from './stage02';
import { stage03 } from './stage03';

export const stageCatalog: StageConfig[] = [stage01, stage02, stage03];
