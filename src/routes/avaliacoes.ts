import { Router } from 'express';
import { db } from '../db';
import { avaliacoes, usuarios } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// Helper: valida o ID
function validarID(id: string | string[] | undefined): string {
  if (!id || typeof id !== 'string') {
    throw new Error('ID inválido');
  }
  return id;
}

// Helper: valida nota entre 1 e 5 (ou null se não enviada)
function validarNota(nota: any, campo: string): number | null {
  if (nota === undefined || nota === null || nota === '') return null;
  const n = Number(nota);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`${campo} deve ser um número inteiro entre 1 e 5`);
  }
  return n;
}

// PÚBLICO - GET /avaliacoes
// Lista só as aprovadas + média + filtro por nota
router.get('/', async (req, res) => {
  try {
    const { nota } = req.query;

    const aprovadas = await db
      .select({
        id: avaliacoes.id,
        nota_geral: avaliacoes.nota_geral,
        nota_navegacao: avaliacoes.nota_navegacao,
        nota_design: avaliacoes.nota_design,
        nota_checkout: avaliacoes.nota_checkout,
        comentario: avaliacoes.comentario,
        resposta_admin: avaliacoes.resposta_admin,
        respondido_em: avaliacoes.respondido_em,
        createdAt: avaliacoes.createdAt,
        usuario_nome: usuarios.nome,
      })
      .from(avaliacoes)
      .innerJoin(usuarios, eq(avaliacoes.usuario_id, usuarios.id))
      .where(eq(avaliacoes.status, 'aprovada'))
      .orderBy(desc(avaliacoes.createdAt));

    const filtradas = nota
      ? aprovadas.filter((a) => a.nota_geral === Number(nota))
      : aprovadas;

    const media =
      aprovadas.length > 0
        ? aprovadas.reduce((acc, a) => acc + a.nota_geral, 0) / aprovadas.length
        : 0;

    res.json({
      total: aprovadas.length,
      media: Number(media.toFixed(2)),
      avaliacoes: filtradas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar avaliações' });
  }
});

// CLIENTE - GET /avaliacoes/minha
// Retorna a avaliação do usuário logado (ou null)
router.get('/minha', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const minha = await db
      .select()
      .from(avaliacoes)
      .where(eq(avaliacoes.usuario_id, usuario_id));

    res.json(minha[0] || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar sua avaliação' });
  }
});

// CLIENTE - POST /avaliacoes
// Cria ou edita a avaliação (volta a "pendente")
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const { nota_geral, nota_navegacao, nota_design, nota_checkout, comentario } = req.body;

    if (!nota_geral) {
      return res.status(400).json({ message: 'Nota geral é obrigatória' });
    }

    let ng: number, nn: number | null, nd: number | null, nc: number | null;
    try {
      ng = validarNota(nota_geral, 'nota_geral')!;
      nn = validarNota(nota_navegacao, 'nota_navegacao');
      nd = validarNota(nota_design, 'nota_design');
      nc = validarNota(nota_checkout, 'nota_checkout');
    } catch (e) {
      return res.status(400).json({
        message: e instanceof Error ? e.message : 'Nota inválida',
      });
    }

    const existente = await db
      .select()
      .from(avaliacoes)
      .where(eq(avaliacoes.usuario_id, usuario_id));

    // Se já existe, atualiza e volta a "pendente"
    if (existente[0]) {
      const updated = await db
        .update(avaliacoes)
        .set({
          nota_geral: ng,
          nota_navegacao: nn,
          nota_design: nd,
          nota_checkout: nc,
          comentario: comentario || null,
          status: 'pendente',
          resposta_admin: null,
          respondido_em: null,
          updatedAt: new Date(),
        })
        .where(eq(avaliacoes.usuario_id, usuario_id))
        .returning();

      return res.json({
        message: 'Avaliação atualizada. Aguardando nova moderação.',
        avaliacao: updated[0],
      });
    }

    // Se não existe, cria
    const nova = await db
      .insert(avaliacoes)
      .values({
        usuario_id,
        nota_geral: ng,
        nota_navegacao: nn,
        nota_design: nd,
        nota_checkout: nc,
        comentario: comentario || null,
      })
      .returning();

    res.status(201).json({
      message: 'Avaliação enviada! Aguardando aprovação.',
      avaliacao: nova[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao salvar avaliação' });
  }
});

// CLIENTE - DELETE /avaliacoes/minha
// Usuário exclui a própria avaliação
router.delete('/minha', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const usuario_id = req.userId;
    if (!usuario_id) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const deleted = await db
      .delete(avaliacoes)
      .where(eq(avaliacoes.usuario_id, usuario_id))
      .returning();

    if (!deleted[0]) {
      return res.status(404).json({ message: 'Você ainda não tem uma avaliação' });
    }

    res.json({ message: 'Avaliação removida com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao remover avaliação' });
  }
});

// ADMIN - GET /avaliacoes/admin/todas
// Lista todas (pendentes, aprovadas e rejeitadas)
router.get('/admin/todas', adminMiddleware, async (req, res) => {
  try {
    const todas = await db
      .select({
        id: avaliacoes.id,
        usuario_id: avaliacoes.usuario_id,
        usuario_nome: usuarios.nome,
        usuario_email: usuarios.email,
        nota_geral: avaliacoes.nota_geral,
        nota_navegacao: avaliacoes.nota_navegacao,
        nota_design: avaliacoes.nota_design,
        nota_checkout: avaliacoes.nota_checkout,
        comentario: avaliacoes.comentario,
        status: avaliacoes.status,
        resposta_admin: avaliacoes.resposta_admin,
        respondido_em: avaliacoes.respondido_em,
        createdAt: avaliacoes.createdAt,
      })
      .from(avaliacoes)
      .innerJoin(usuarios, eq(avaliacoes.usuario_id, usuarios.id))
      .orderBy(desc(avaliacoes.createdAt));

    res.json(todas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar avaliações' });
  }
});

// ADMIN - PATCH /avaliacoes/admin/:id/aprovar
router.patch('/admin/:id/aprovar', adminMiddleware, async (req, res) => {
  try {
    const id = validarID(req.params.id);

    const updated = await db
      .update(avaliacoes)
      .set({ status: 'aprovada', updatedAt: new Date() })
      .where(eq(avaliacoes.id, id))
      .returning();

    if (!updated[0]) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    res.json({ message: 'Avaliação aprovada', avaliacao: updated[0] });
  } catch (error) {
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erro ao aprovar avaliação' });
  }
});

// ADMIN - PATCH /avaliacoes/admin/:id/rejeitar
router.patch('/admin/:id/rejeitar', adminMiddleware, async (req, res) => {
  try {
    const id = validarID(req.params.id);

    const updated = await db
      .update(avaliacoes)
      .set({ status: 'rejeitada', updatedAt: new Date() })
      .where(eq(avaliacoes.id, id))
      .returning();

    if (!updated[0]) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    res.json({ message: 'Avaliação rejeitada', avaliacao: updated[0] });
  } catch (error) {
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erro ao rejeitar avaliação' });
  }
});

// ADMIN - PATCH /avaliacoes/admin/:id/responder
router.patch('/admin/:id/responder', adminMiddleware, async (req, res) => {
  try {
    const id = validarID(req.params.id);
    const { resposta } = req.body;

    if (!resposta || resposta.trim().length === 0) {
      return res.status(400).json({ message: 'Resposta não pode ser vazia' });
    }

    const updated = await db
      .update(avaliacoes)
      .set({
        resposta_admin: resposta,
        respondido_em: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(avaliacoes.id, id))
      .returning();

    if (!updated[0]) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    res.json({ message: 'Resposta registrada', avaliacao: updated[0] });
  } catch (error) {
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erro ao responder avaliação' });
  }
});

// ADMIN - DELETE /avaliacoes/admin/:id
// Admin exclui qualquer avaliação
router.delete('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    const id = validarID(req.params.id);

    const deleted = await db
      .delete(avaliacoes)
      .where(eq(avaliacoes.id, id))
      .returning();

    if (!deleted[0]) {
      return res.status(404).json({ message: 'Avaliação não encontrada' });
    }
    res.json({ message: 'Avaliação removida pelo administrador' });
  } catch (error) {
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erro ao remover avaliação' });
  }
});

export default router;