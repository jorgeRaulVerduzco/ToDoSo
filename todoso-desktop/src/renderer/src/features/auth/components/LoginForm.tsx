import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginCredentials, LoginCredentialsSchema } from '../types/auth';
import { useLogin } from '../hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

export function LoginForm() {
  const { mutateAsync: login, isPending } = useLogin();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(LoginCredentialsSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setErrorMsg(null);
    try {
      await login(data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setErrorMsg('Usuario o contraseña incorrectos.');
      } else {
        setErrorMsg('No pudimos conectar, revisa tu conexión.');
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {errorMsg && (
        <div className="p-3 text-sm text-destructive border border-destructive/20 rounded-md bg-destructive/10">
          {errorMsg}
        </div>
      )}

      <div>
        <Input
          placeholder="Usuario"
          {...form.register('username')}
          disabled={isPending}
        />
        {form.formState.errors.username && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Contraseña"
          {...form.register('password')}
          disabled={isPending}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-2 pb-4">
        <Checkbox
          id="remember"
          checked={form.watch('rememberMe')}
          onCheckedChange={(val) => form.setValue('rememberMe', val as boolean)}
          disabled={isPending}
        />
        <label
          htmlFor="remember"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Mantener sesión iniciada
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Iniciando sesión...' : 'Entrar'}
      </Button>
    </form>
  );
}
