import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { auth } from '../../firebase/config';
import { repository } from '../../lib/repository';
import { useAuth } from './auth-context';

function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/invalid-credential') return 'E-mail ou senha inválidos.';
    if (error.code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    if (error.code === 'auth/network-request-failed') return 'Não foi possível conectar ao Firebase.';
  }
  return 'Não foi possível entrar. Tente novamente.';
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  useEffect(() => {
    if (!loading && user) navigate(destination, { replace: true });
  }, [destination, loading, navigate, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isDemo) {
      navigate(destination, { replace: true });
      return;
    }
    if (!auth) {
      setError('Firebase não está configurado neste ambiente.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <Card className="w-full max-w-md border-slate-800 bg-white">
        <CardContent className="p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Incor Projetos</h1>
              <p className="text-sm text-slate-500">Controle de versões, aprovação e obra.</p>
            </div>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field label="E-mail">
              <Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </Field>
            <Field label="Senha">
              <Input
                autoComplete="current-password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </Field>
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <Button disabled={submitting || loading} type="submit">
              {submitting ? 'Entrando...' : isDemo ? 'Entrar no protótipo' : 'Entrar'}
            </Button>
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              {repository.mode === 'firebase'
                ? 'Acesso protegido pelo Firebase Authentication.'
                : 'Sem Firebase configurado: o app roda em modo demo com dados no navegador.'}
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
