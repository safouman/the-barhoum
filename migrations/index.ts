import * as migration_20261107_160000_learning_progress from './20261107_160000_learning_progress';
import * as migration_20261107_120000_course_commerce from './20261107_120000_course_commerce';
import * as migration_20261106_105408_initial from './20261106_105408_initial';
import * as migration_20261106_123150_course_content from './20261106_123150_course_content';
import * as migration_20261106_125512_public_cover_url from './20261106_125512_public_cover_url';
import * as migration_20261106_133856_vimeo_and_cover_storage from './20261106_133856_vimeo_and_cover_storage';
import * as migration_20261106_145739_module_drafts from './20261106_145739_module_drafts';
import * as migration_20261106_213612_student_auth from './20261106_213612_student_auth';

export const migrations = [
  {
    up: migration_20261106_105408_initial.up,
    down: migration_20261106_105408_initial.down,
    name: '20261106_105408_initial',
  },
  {
    up: migration_20261106_123150_course_content.up,
    down: migration_20261106_123150_course_content.down,
    name: '20261106_123150_course_content',
  },
  {
    up: migration_20261106_125512_public_cover_url.up,
    down: migration_20261106_125512_public_cover_url.down,
    name: '20261106_125512_public_cover_url',
  },
  {
    up: migration_20261106_133856_vimeo_and_cover_storage.up,
    down: migration_20261106_133856_vimeo_and_cover_storage.down,
    name: '20261106_133856_vimeo_and_cover_storage',
  },
  {
    up: migration_20261106_145739_module_drafts.up,
    down: migration_20261106_145739_module_drafts.down,
    name: '20261106_145739_module_drafts',
  },
  {
    up: migration_20261106_213612_student_auth.up,
    down: migration_20261106_213612_student_auth.down,
    name: '20261106_213612_student_auth'
  },
  {
    up: migration_20261107_120000_course_commerce.up,
    down: migration_20261107_120000_course_commerce.down,
    name: '20261107_120000_course_commerce'
  },
  {
    up: migration_20261107_160000_learning_progress.up,
    down: migration_20261107_160000_learning_progress.down,
    name: '20261107_160000_learning_progress',
  },
];
