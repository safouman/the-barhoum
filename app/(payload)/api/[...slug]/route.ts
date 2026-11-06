/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* Keep the adminREST guard if regenerating the Payload route. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { adminREST } from '../../../../lib/student-auth/admin-rest'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

export const GET = adminREST(REST_GET(config))
export const POST = adminREST(REST_POST(config))
export const DELETE = adminREST(REST_DELETE(config))
export const PATCH = adminREST(REST_PATCH(config))
export const PUT = adminREST(REST_PUT(config))
export const OPTIONS = adminREST(REST_OPTIONS(config))
