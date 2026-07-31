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
        excluded_payment_types: [
        { id: 'ticket' },
        ],
        installments: 12,
    },
    back_urls: {
        success: `http://localhost:3000/pedido-confirmado`,
        failure: `http://localhost:3000/checkout?status=failed`,
        pending: `http://localhost:3000/checkout?status=pending`,
    },
    notification_url: `http://localhost:3001/webhook/pagamento`,
    // ✅ FORÇAR Checkout Pro (redireciona para o MP)
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