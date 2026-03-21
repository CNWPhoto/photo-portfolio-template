import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete('__sanity_preview_secret', { path: '/' })
  return redirect('/', 307)
}
