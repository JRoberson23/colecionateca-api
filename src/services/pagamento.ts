import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configurar o Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export async function criarPreferenciaPagamento(itens: any[], endereco: any, usuario: any) {
  try {
    const preference = new Preference(client);

    const body = {
      items: itens.map((item) => ({
        id: item.produto_id || `item_${Date.now()}_${Math.random()}`,
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco_unitario,
        currency_id: 'BRL',
      })),
      payer: {
        name: usuario.nome,
        email: usuario.email,
      },
      payment_methods: {
        excluded_payment_methods: [
          { id: 'bolbradesco' },
        ],
        installments: 12,
      },
      back_urls: {
        success: `${process.env.APP_URL || 'https://roberson-store.vercel.app'}/pedido-confirmado`,
        failure: `${process.env.APP_URL || 'https://roberson-store.vercel.app'}/checkout?status=failed`,
        pending: `${process.env.APP_URL || 'https://roberson-store.vercel.app'}/checkout?status=pending`,
      },
      notification_url: `${process.env.API_URL || 'https://colecionateca-api.onrender.com'}/webhook/pagamento`,
      marketplace: 'MLB',
    };

    const response = await preference.create({ body });
    console.log('Body enviado para o Mercado Pago:', JSON.stringify(body, null, 2));
    return response;
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    throw error;
  }
}