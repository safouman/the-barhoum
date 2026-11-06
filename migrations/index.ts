import * as migration_20261106_105408_initial from './20261106_105408_initial';
import * as migration_20261106_123150_course_content from './20261106_123150_course_content';
import * as migration_20261106_125512_public_cover_url from './20261106_125512_public_cover_url';
import * as migration_20261106_133856_vimeo_and_cover_storage from './20261106_133856_vimeo_and_cover_storage';

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
    name: '20261106_133856_vimeo_and_cover_storage'
  },
];
