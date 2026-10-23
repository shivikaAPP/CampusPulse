import { LocalRepository } from './LocalRepository.js';
import { HttpRepository } from './HttpRepository.js';
import type { Repository } from './Repository.js';

export * from './Repository.js';
export * from './LocalRepository.js';
export * from './HttpRepository.js';

const dataSource = import.meta.env.VITE_DATA_SOURCE;

export const repository: Repository =
  dataSource === 'api' ? new HttpRepository() : new LocalRepository();
