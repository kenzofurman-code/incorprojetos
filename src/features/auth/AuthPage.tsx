import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Field, Input } from '../../components/ui/Field';
import { repository } from '../../lib/repository';

export function AuthPage() {
  const navigate = useNavigate();

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

          <div className="grid gap-4">
            <Field label="E-mail">
              <Input defaultValue="coordenador@demo.com" type="email" />
            </Field>
            <Field label="Senha">
              <Input defaultValue="demo1234" type="password" />
            </Field>
            <Button onClick={() => navigate('/')}>Entrar no protótipo</Button>
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              {repository.mode === 'firebase'
                ? 'Firebase detectado. Esta tela está pronta para receber autenticação real.'
                : 'Sem .env.local configurado: o app roda em modo demo com dados no navegador.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
