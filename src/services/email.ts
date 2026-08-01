import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function enviarEmailVerificacao(email: string, nome: string, token: string) {
    const link = `${APP_URL}/auth/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: "Confirme seu e-mail - Colecionateca",
        html: `
            <h1>Olá, ${nome}!</h1>
            <p>Obrigado por se registrar na Colecionateca. Por favor, confirme seu e-mail clicando no link abaixo:</p>
            <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Confirmar e-mail</a>
            <p>Se você não se registrou na Colecionateca, por favor ignore este e-mail.</p>
            <p>Este link de verificação expira em 24 horas.</p>
            <p>Atenciosamente,<br/>Equipe Colecionateca</p>
        `,
    });

    if (error) {
        console.error("Erro ao enviar e-mail de verificação:", error);
        throw new Error("Erro ao enviar e-mail de verificação");
    }

    return data;
}

export async function enviarEmailRecuperacao(email: string, nome: string, token: string) {
    const link = `${APP_URL}/auth/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: 'Recuperação de senha - Colecionateca',
        html: `
            <h1>Olá, ${nome}!</h1>
            <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Redefinir senha</a>
            <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
            <p>Este link expira em 1 hora.</p>
        `
    });

    if (error) {
        console.error('Erro ao enviar e-mail de recuperação:', error);
        throw new Error('Erro ao enviar e-mail de recuperação');
    }

    return data;
}

export async function enviarEmailNotificacaoPedido(
  emailLoja: string,
  pedido: any,
  cliente: any,
  itens: any[]
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [emailLoja],
      subject: `🛒 Novo Pedido #${pedido.id.substring(0, 8)} - Colecionateca`,
      html: `
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
          Este e-mail foi enviado automaticamente pelo sistema Colecionateca.<br>
          Para gerenciar este pedido, acesse o painel administrativo.
        </p>
      `,
    });

    if (error) {
      console.error('Erro ao enviar e-mail de notificação:', error);
      throw new Error('Erro ao enviar e-mail de notificação');
    }

    return data;
  } catch (error) {
    console.error('Erro ao enviar e-mail de notificação:', error);
    throw error;
  }
}