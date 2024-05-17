import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh)] mt-[90px] flex-col gap-4 items-center text-center ">
      {children}
    </main>
  )
}
