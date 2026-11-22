const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ⚠️ Este e-mail precisa estar verificado na Brevo (Senders & IP)
const BREVO_SENDER_EMAIL = 'jroberson.junior@outlook.com';
const BREVO_SENDER_NAME = 'Roberson Store';

// Função auxiliar que centraliza o envio via API HTTP da Brevo
async function enviarEmailBrevo(payload: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}) {
  const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      ...payload,
    }),
  });

  if (!resposta.ok) {
    const corpoErro = await resposta.text();
    console.error('Erro na API da Brevo:', resposta.status, corpoErro);
    throw new Error('Falha ao enviar e-mail via Brevo');
  }

  return resposta.json();
}

export async function enviarEmailVerificacao(email: string, nome: string, token: string) {
    const link = `${APP_URL}/auth/verify-email?token=${token}`;

    const html = `
        <h1>Olá, ${nome}!</h1>
        <p>Obrigado por se registrar na Roberson Store. Por favor, confirme seu e-mail clicando no link abaixo:</p>
        <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Confirmar e-mail</a>
        <p>Se você não se registrou na Roberson Store, por favor ignore este e-mail.</p>
        <p>Este link de verificação expira em 24 horas.</p>
        <p>Atenciosamente,<br/>Equipe Roberson Store</p>
    `;

    return enviarEmailBrevo({
        to: [{ email, name: nome }],
        subject: "Confirme seu e-mail - Roberson Store",
        htmlContent: html,
    });
}

export async function enviarEmailRecuperacao(email: string, nome: string, token: string) {
    const link = `${APP_URL}/auth/reset-password?token=${token}`;

    const html = `
        <h1>Olá, ${nome}!</h1>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Redefinir senha</a>
        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
        <p>Este link expira em 1 hora.</p>
    `;

    return enviarEmailBrevo({
        to: [{ email, name: nome }],
        subject: 'Recuperação de senha - Roberson Store',
        htmlContent: html,
    });
}

export async function enviarEmailNotificacaoPedido(
  emailLoja: string,
  pedido: any,
  cliente: any,
  itens: any[]
) {
    const html = `
        <h1>🛒 Novo Pedido Recebido!</h1>

        <h2>📋 Detalhes do Pedido</h2>
        <p><strong>Número do pedido:</strong> ${pedido.id}</p>
        <p><strong>Data:</strong> ${new Date(pedido.data_pedido).toLocaleString('pt-BR')}</p>
        <p><strong>Status:</strong> ${pedido.status}</p>

        <h2>👤 Dados do Cliente</h2>
        <p><strong>Nome:</strong> ${cliente.nome}</p>
        <p><strong>E-mail:</strong> ${cliente.email}</p>
        <p><strong>Telefone:</strong> ${cliente.telefone || 'Não informado'}</p>

        <h2>📦 Itens do Pedido</h2>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left;">Produto</th>
              <th style="padding: 8px; text-align: center;">Quantidade</th>
              <th style="padding: 8px; text-align: right;">Preço</th>
              <th style="padding: 8px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map((item) => `
              <tr>
                <td style="padding: 8px;">${item.nome}</td>
                <td style="padding: 8px; text-align: center;">${item.quantidade}</td>
                <td style="padding: 8px; text-align: right;">R$ ${item.preco_unitario.toFixed(2)}</td>
                <td style="padding: 8px; text-align: right;">R$ ${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Frete:</td>
              <td style="padding: 8px; text-align: right;">R$ ${pedido.frete.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 8px; text-align: right; font-size: 18px; font-weight: bold; color: #16a34a;">R$ ${pedido.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <h2>📍 Endereço de Entrega</h2>
        <p>
          ${pedido.endereco?.logradouro}, ${pedido.endereco?.numero}<br>
          ${pedido.endereco?.bairro}, ${pedido.endereco?.cidade} - ${pedido.endereco?.estado}<br>
          CEP: ${pedido.endereco?.cep}
        </p>

        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          Este e-mail foi enviado automaticamente pelo sistema Roberson Store.<br>
          Para gerenciar este pedido, acesse o painel administrativo.
        </p>
    `;

    return enviarEmailBrevo({
        to: [{ email: emailLoja }],
        subject: `🛒 Novo Pedido #${pedido.id.substring(0, 8)} - Roberson Store`,
        htmlContent: html,
    });
}