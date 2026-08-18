# 📡 Colecionateca - API

Backend do e-commerce de consoles e jogos antigos.

---

## 🚀 Tecnologias

- Node.js 24
- Express 5
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon)

---

## 🛠️ Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Preencha com suas credenciais

# 3. Rodar migrations
npm run db:generate
npm run db:migrate

# 4. Iniciar servidor
npm run dev

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão com PostgreSQL |
| `JWT_SECRET` | Chave para tokens JWT |
| `RESEND_API_KEY` | API Key do Resend (e-mails) |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token do Mercado Pago |
| `MELHOR_ENVIO_TOKEN` | Token do Melhor Envio |
| `CLOUDINARY_*` | Credenciais do Cloudinary |

---

## 📡 Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cadastro de usuário |
| `POST` | `/auth/login` | Login (retorna token) |
| `GET` | `/produtos` | Listar produtos |
| `GET` | `/produtos/destaque` | Produtos em destaque |
| `POST` | `/checkout/pagar` | Criar pagamento no MP |
| `POST` | `/frete/calcular` | Calcular frete |

---

🌐 Deploy
Render: https://colecionateca-api.onrender.com