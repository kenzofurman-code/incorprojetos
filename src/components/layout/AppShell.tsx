import { Bell, ClipboardCheck, FileStack, Home, LogOut, Printer, QrCode, Settings, ShieldCheck } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { repository } from '../../lib/repository';

const links = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/documentos', label: 'Documentos', icon: FileStack },
  { to: '/aprovacoes', label: 'Aprovações', icon: ClipboardCheck },
  { to: '/obra', label: 'Obra', icon: QrCode },
  { to: '/impressos', label: 'Impressos', icon: Printer },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppShell() {
  const { user, logout, isDemo } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.displayName || (isDemo ? 'Coordenador Demo' : 'Usuário');
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="font-black tracking-tight">Incor Projetos</p>
            <p className="text-xs text-slate-500">CDE + versões + obra</p>
          </div>
        </div>
        <nav className="grid gap-1 p-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Modo atual</p>
          <p className="mt-1">{repository.mode === 'firebase' ? 'Firebase conectado' : 'Demo local com localStorage'}</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Empreendimento</p>
            <h1 className="text-xl font-black tracking-tight">Vila Olímpia</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Notificações">
              <Bell size={18} />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-slate-500">{user?.email || 'Modo demonstração'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{initials}</div>
            {!isDemo && (
              <button
                aria-label="Sair"
                className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                onClick={() => void handleLogout()}
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
