'use client'

import { useServerAction } from '@rubenbupe/orpc-react/hooks'
import { getting } from './actions'
import { onSuccess } from '@rubenbupe/orpc-client'

export function OrpcServerAction() {
  const state = useServerAction(getting, {
    interceptors: [
      onSuccess((message) => {
        alert(message)
      }),
    ],
  })

  const action = async (form: FormData) => {
    const name = form.get('name') as string
    state.execute({ name })
  }

  return (
    <form action={action}>
      <input type="text" name="name" defaultValue="unnoq" required />
      <button type="submit">Test server action</button>
    </form>
  )
}
