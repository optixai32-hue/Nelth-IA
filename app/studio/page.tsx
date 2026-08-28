import { ImageEditor } from '@/components/elements/image-editor'

export default function StudioPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">Studio d’édition d’image</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Charge une image et décris la transformation à appliquer.
      </p>
      <ImageEditor />
    </div>
  )
}
