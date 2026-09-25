export function Login() {
  return (
    <div className="flex h-screen w-full items-center justify-center titlebar bg-background">
      <div className="p-8 bg-card rounded-lg border shadow-sm w-full max-w-md no-drag">
        <h1 className="text-2xl font-bold text-center mb-6">toDoSo</h1>
        <p className="text-center text-muted-foreground mb-4">Inicia sesión para continuar</p>
        <button className="w-full bg-primary text-primary-foreground py-2 rounded">
          Login (Placeholder)
        </button>
      </div>
    </div>
  )
}
