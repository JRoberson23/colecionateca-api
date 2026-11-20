# 📡 Roberson Store - API

Backend do e-commerce de consoles e jogos, desenvolvido como projeto de TCC e portfólio full-stack.

> **Nota:** o projeto foi originalmente desenvolvido para um cliente sob o nome "Colecionateca". Após o cliente desistir do projeto, ele foi adaptado como portfólio pessoal e trabalho de conclusão de curso.

---

## 🚀 Tecnologias

- Node.js 24
- Express 5
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon)

**Integrações:** Mercado Pago (Checkout Pro), Melhor Envio (frete), Cloudinary (imagens), Resend (e-mail).

---

## 📊 Diagrama de Classes

```mermaid
classDiagram
    class Usuario {
        +UUID id
        +String nome
        +String email
        +String senha_hash
        +String role
        +Boolean email_verificado
        +String token_verificacao
        +Timestamp token_expiracao
        +String reset_token
        +Timestamp reset_token_expires
        +Timestamp createdAt
        +Timestamp updatedAt
        +login()
        +registrar()
        +verificarEmail()
        +recuperarSenha()
    }

    class Endereco {
        +UUID id
        +UUID usuario_id
        +String logradouro
        +String numero
        +String complemento
        +String bairro
        +String cidade
        +String estado
        +String cep
        +String pais
        +String tipo
        +Timestamp createdAt
        +Timestamp updatedAt
    }

    class Produto {
        +UUID id
        +String nome
        +String descricao
        +Float preco
        +Int estoque
        +JSON imagens
        +String categoria
        +JSON metadata
        +Boolean destaque
        +Timestamp createdAt
        +Timestamp updatedAt
        +verificarEstoque()
        +atualizarEstoque()
    }

    class Pedido {
        +UUID id
        +UUID usuario_id
        +UUID endereco_id
        +String status
        +Float total
        +Float frete
        +String metodo_pagamento
        +Timestamp data_pedido
        +Timestamp createdAt
        +Timestamp updatedAt
        +calcularTotal()
        +atualizarStatus()
    }

    class ItemPedido {
        +UUID id
        +UUID pedido_id
        +UUID produto_id
        +Int quantidade
        +Float preco_unitario
        +Float subtotal
        +Timestamp createdAt
        +calcularSubtotal()
    }

    Usuario "1" --> "*" Pedido : realiza
    Usuario "1" --> "*" Endereco : possui
    Pedido "1" --> "*" ItemPedido : contém
    Produto "1" --> "*" ItemPedido : referenciado
    Pedido "1" --> "1" Endereco : entrega

    note for Usuario "role: 'cliente' | 'admin'\nAdmin gerencia produtos, pedidos e usuários"
```

---

## 🛠️ Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Rodar migrations
npm run db:generate
npm run db:migrate

# 4. Iniciar servidor
npm run dev
```

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão com PostgreSQL |
| `JWT_SECRET` | Chave para tokens JWT |
| `RESEND_API_KEY` | API Key do Resend (e-mails) |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token do Mercado Pago (sandbox) |
| `MERCADO_PAGO_PUBLIC_KEY` | Public Key do Mercado Pago |
| `MELHOR_ENVIO_TOKEN` | Token do Melhor Envio (sandbox) |
| `CLOUDINARY_*` | Credenciais do Cloudinary |
| `EMAIL_LOJISTA` | E-mail que recebe notificações de pedido |

---

## 📡 Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/register` | Cadastro de usuário |
| `POST` | `/auth/login` | Login (retorna token) |
| `GET` | `/produtos` | Listar produtos |
| `GET` | `/produtos/destaque` | Produtos em destaque |
| `POST` | `/checkout/pagar` | Criar pagamento no Mercado Pago |
| `POST` | `/frete/calcular` | Calcular frete |
| `GET` | `/health` | Health check |

---

## 🧭 Decisões Técnicas

- **Drizzle ORM em vez de Prisma:** tipagem mais próxima do SQL e menor overhead em runtime.
- **Checkout Pro do Mercado Pago:** reduz a complexidade de PCI compliance, delegando a captura de dados do cartão ao ambiente seguro do Mercado Pago.
- **Melhor Envio para frete:** integração com múltiplas transportadoras em uma única API.
- **Webhook de pagamento não implementado:** decisão consciente de escopo, por ser um projeto de demonstração sem entrega real de produtos. O fluxo de pagamento é funcional até a confirmação no Mercado Pago.
- **RBAC com campo `role`:** não existe tabela separada de admin; o administrador é um `Usuario` com `role = 'admin'`, o que simplifica a modelagem.

---

## 🌐 Deploy

Render: [https://colecionateca-api.onrender.com](https://colecionateca-api.onrender.com)

---

## 👤 Autor

**Roberson Junior** — Desenvolvedor Full-Stack
- GitHub: [@JRoberson23](https://github.com/JRoberson23)
- YouTube: [@RobersonDev](https://www.youtube.com/@RobersonDev)