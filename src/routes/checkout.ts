import { Router } from 'express';
import { db } from '../db';
import { produtos, pedidos, itensPedido, usuarios, enderecos } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { criarPreferenciaPagamento } from '../services/pagamento';
import { enviarEmailNotificacaoPedido } from '../services/email';

const router = Router();

// ✅ ROTA PARA CRIAR PREFERÊNCIA DE PAGAMENTO
router.post('/pagar', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const { itens, endereco } = req.body;

    // Buscar dados do usuário
    const usuario = await db.select().from(usuarios).where(eq(usuarios.id, usuario_id));
    if (!usuario[0]) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Criar a preferência no Mercado Pago
    const preferencia = await criarPreferenciaPagamento(itens, endereco, usuario[0]);

    res.json({
      init_point: preferencia.init_point,
      preference_id: preferencia.id,
    });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ message: 'Erro ao criar pagamento' });
  }
});

// Todos os endpoints de checkout exigem autenticação
router.use(authMiddleware);

// POST /checkout - Finalizar compra
router.post('/', async (req: AuthRequest, res) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const { endereco_id, itens, frete = 0, metodo_pagamento } = req.body;

    // 1. VALIDAÇÃO: Endereço e itens são obrigatórios
    if (!endereco_id || !itens || itens.length === 0) {
      return res.status(400).json({
        message: 'Endereço e itens são obrigatórios',
      });
    }

    // 2. VALIDAÇÃO DE ESTOQUE
    for (const item of itens) {
      const [produto] = await db
        .select()
        .from(produtos)
        .where(eq(produtos.id, item.produto_id));

      if (!produto) {
        return res.status(400).json({
          message: `Produto com ID ${item.produto_id} não encontrado.`,
        });
      }

      if (produto.estoque < item.quantidade) {
        return res.status(400).json({
          message: `Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}`,
        });
      }
    }

    // 3. CÁLCULO DO TOTAL
    const total = itens.reduce((acc: number, item: any) => acc + item.subtotal, 0);

    // 4. CRIAÇÃO DO PEDIDO (TRANSAÇÃO)
    const novoPedido = await db.transaction(async (tx) => {
      const [pedidoCriado] = await tx
        .insert(pedidos)
        .values({
          id: sql`gen_random_uuid()`,
          usuario_id: usuario_id,
          endereco_id: endereco_id,
          total: total + frete,
          frete: frete,
          status: 'pendente',
          metodo_pagamento: metodo_pagamento,
          data_pedido: new Date(),
        })
        .returning();

      if (!pedidoCriado) {
        throw new Error('Erro ao criar pedido');
      }

      const pedidoId = pedidoCriado.id;

      for (const item of itens) {
        await tx.insert(itensPedido).values({
          pedido_id: pedidoId,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
        });

        await tx
          .update(produtos)
          .set({
            estoque: sql`${produtos.estoque} - ${item.quantidade}`,
            updatedAt: new Date(),
          })
          .where(eq(produtos.id, item.produto_id));
      }

      return pedidoCriado;
    });

    // ✅ 5. ENVIAR E-MAIL DE NOTIFICAÇÃO PARA O LOJISTA
    try {
      const cliente = await db.select().from(usuarios).where(eq(usuarios.id, usuario_id));
      if (cliente[0]) {
        const endereco = await db.select().from(enderecos).where(eq(enderecos.id, endereco_id));
        const pedidoCompleto = {
          ...novoPedido,
          endereco: endereco[0] || null,
        };
        
        await enviarEmailNotificacaoPedido(
          process.env.EMAIL_LOJISTA || 'colecionateca@gmail.com',
          pedidoCompleto,
          cliente[0],
          itens
        );
        console.log('📧 E-mail de notificação enviado para o lojista');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail de notificação:', error);
      // Não bloqueia o fluxo principal se o e-mail falhar
    }

    res.status(201).json({
      message: 'Pedido finalizado com sucesso!',
      pedido: novoPedido,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao finalizar pedido' });
  }
});

export default router;