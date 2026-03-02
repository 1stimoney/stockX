import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className='min-h-screen px-4 py-8'>
      <div className='mx-auto max-w-3xl'>
        <Card className='border-white/10 bg-white/5'>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
          </CardHeader>
          <CardContent className='text-sm text-zinc-400'>
            Settings coming next — profile edit, password update, and security
            preferences.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
