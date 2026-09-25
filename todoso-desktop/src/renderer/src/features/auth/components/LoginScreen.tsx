import { LoginForm } from './LoginForm';

export function LoginScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center titlebar bg-background">
      <div className="p-8 bg-card rounded-lg border shadow-sm w-full max-w-sm no-drag relative">
        <h1 className="text-2xl font-bold text-center mb-2">toDoSo</h1>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          Inicia sesión para comenzar tu enfoque
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
