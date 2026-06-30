# Incor Projetos v1

Protótipo inicial de um aplicativo web para controle de versões de projetos, aprovação técnica, consulta em obra, QR Code e controle de impressos.

Esta primeira versão foi montada para você subir no GitHub e publicar na Vercel. Ela já roda em dois modos:

1. **Demo local**: funciona sem Firebase, usando `localStorage` no navegador.
2. **Firebase**: ao preencher `.env.local`, passa a usar Firestore e Storage para persistência.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase Auth / Firestore / Storage, já estruturado
- React Router
- QRCode
- Vercel

## Módulos incluídos

- Dashboard do empreendimento
- Cadastro/listagem de documentos
- Upload de PDF
- Histórico de revisões
- Aprovação, rejeição e liberação para obra
- Visualizador PDF via `iframe`
- Cadastro de issues técnicas
- Armário digital de projetos para obra
- Corte vertical da edificação
- QR Code por revisão liberada
- Simulação de leitura de QR Code
- Solicitação de plotagem
- Cadastro de disciplinas e siglas

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço indicado pelo Vite.

## Como conectar ao Firebase

1. Crie um projeto no Firebase.
2. Ative Firestore Database.
3. Ative Storage.
4. Ative Authentication, se quiser evoluir o login real.
5. Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

6. Preencha as variáveis:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

7. Rode novamente:

```bash
npm run dev
```

Sem essas variáveis, o app continua funcionando em modo demo local.

## Regras Firebase

Incluí dois arquivos iniciais:

- `firebase.rules`
- `storage.rules`

Eles exigem usuário autenticado para ler/escrever. Para protótipo interno, isso é suficiente como ponto de partida. Para produção, será necessário evoluir para regras por empresa, empreendimento e papel do usuário.

## Como subir para o GitHub

```bash
git init
git add .
git commit -m "Versão inicial do Incor Projetos"
git branch -M main
git remote add origin https://github.com/kenzofurman-code/incorprojetos.git
git push -u origin main
```

## Como publicar na Vercel

1. Entre na Vercel.
2. Importe o repositório `incorprojetos`.
3. Framework: Vite.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Adicione as variáveis do Firebase em **Project Settings > Environment Variables**.
7. Deploy.

## Próximas melhorias recomendadas

### Sprint 2

- Login real com Firebase Auth.
- Gestão de usuários por papel: coordenador, projetista, obra e administrador.
- Filtro por empreendimento.
- Importação de cronograma via CSV/XLSX.
- Vínculo de marco do cronograma com documento.

### Sprint 3

- Visualizador PDF avançado com `pdf.js`.
- Marcação gráfica de issues diretamente sobre o PDF.
- Pins, retângulos, setas e nuvens de revisão.
- Comentários em thread por issue.

### Sprint 4

- Sobreposição de PDFs por disciplina.
- Controle de cor e opacidade.
- Tela de comparação R00 × R01 com divisores.
- Destaque visual de diferenças.

### Sprint 5

- QR Code impresso em prancha.
- Leitura pela câmera no app.
- Controle automático de cópias obsoletas.
- Relatório de quem está com cada prancha impressa.

## Observação importante

A remoção de textos no processamento de PDF foi deixada como melhoria futura. Isso precisa ser tratado com mais cuidado porque alguns PDFs têm texto real, outros têm texto vetorizado, e outros são imagens rasterizadas. A abordagem mais segura é evoluir esse recurso em uma camada server-side, possivelmente com processamento por imagem.

## Armazenamento de PDFs no Supabase

O Firestore continua sendo usado para os dados e o Firebase Authentication para o login. Os PDFs são enviados ao Supabase Storage por uma URL temporária gerada pela função `/api/upload-url` na Vercel.

1. Crie um projeto gratuito no Supabase.
2. Em **Storage**, crie um bucket público chamado `project-files`.
3. Defina no bucket o limite de 25 MB e permita somente `application/pdf`.
4. Não crie políticas públicas de escrita. A função usa a chave `service_role` apenas no servidor.
5. Na Vercel, adicione em **Production** e **Preview**:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_BUCKET=project-files
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=project-files
```

`SUPABASE_SERVICE_ROLE_KEY` é secreta. Nunca use o prefixo `VITE_` nela e nunca a salve no Git.

Depois de cadastrar as variáveis, gere um novo deploy na Vercel. Para testar as funções da Vercel localmente, use `vercel dev`; `npm run dev` executa somente o frontend.
