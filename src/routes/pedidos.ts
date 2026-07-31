import { Router } from 'express';
import { db } from '../db';
import { pedidos, itensPedido } from '../db/schema';
import { Pedido, ItemPedido } from '../models/Pedido';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// Todos os endpoints de pedido exigem autenticação
router.use(authMiddleware);

// Função auxiliar para validar ID
function validarId(id: string | string[] | undefined): string {
  if (!id || typeof id !== 'string') {
    throw new Error('ID inválido');
  }
  return id;
}

// GET /pedidos - Listar todos os pedidos do usuário
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }
    
    const resultados = await db.select().from(pedidos)
      .where(eq(pedidos.usuario_id, userId));
    
    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar pedidos' });
  }
});

// GET /pedidos/:id - Buscar um pedido específico
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const id = validarId(req.params.id); 
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const resultado = await db.select().from(pedidos)
      .where(and(
        eq(pedidos.id, id),
        eq(pedidos.usuario_id, userId)
      ));

    if (resultado.length === 0 || !resultado[0]) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const pedidoData = resultado[0];

    // Buscar os itens do pedido
    const itens = await db.select().from(itensPedido)
      .where(eq(itensPedido.pedido_id, id));

    res.json({ ...pedidoData, itens });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ message: 'Erro ao buscar pedido' });
  }
});

// POST /pedidos - Criar um novo pedido
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const { endereco_id, itens, frete, metodo_pagamento } = req.body;

    if (!endereco_id || !itens || itens.length === 0) {
      return res.status(400).json({ 
        message: 'Endereço e itens são obrigatórios' 
      });
    }

    const pedido = Pedido.criar(
      userId,
      endereco_id,
      itens,
      frete || 0,
      metodo_pagamento
    );

    const [novoPedido] = await db.insert(pedidos).values({
      id: pedido.id,
      usuario_id: pedido.usuario_id,
      endereco_id: pedido.endereco_id,
      status: pedido.status,
      total: pedido.total,
      frete: pedido.frete,
      metodo_pagamento: pedido.metodo_pagamento,
      data_pedido: pedido.data_pedido,
    }).returning();

    for (const item of itens) {
      await db.insert(itensPedido).values({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
      });
    }

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      pedido: novoPedido,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// PUT /pedidos/:id/status - Atualizar status do pedido
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    const id = validarId(req.params.id); 
    const { status } = req.body;
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const resultado = await db.select().from(pedidos)
      .where(and(
        eq(pedidos.id, id),
        eq(pedidos.usuario_id, userId)
      ));

    if (resultado.length === 0 || !resultado[0]) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const pedidoData = resultado[0];
    const pedidoObj = new Pedido(
      pedidoData.id,
      pedidoData.usuario_id,
      pedidoData.endereco_id,
      [],
      Number(pedidoData.total) || 0,
      Number(pedidoData.frete) || 0,
      pedidoData.status || 'pendente',
      pedidoData.metodo_pagamento || undefined,
      pedidoData.data_pedido || undefined,
      pedidoData.createdAt || undefined,
      pedidoData.updatedAt || undefined
    );

    pedidoObj.atualizarStatus(status);

    await db.update(pedidos)
      .set({ 
        status: pedidoObj.status, 
        updatedAt: pedidoObj.updatedAt || new Date()
      })
      .where(eq(pedidos.id, id));

    res.json({ 
      message: 'Status atualizado com sucesso', 
      status: pedidoObj.status 
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
});

export default router;