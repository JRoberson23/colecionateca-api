import { Router } from 'express';
import { db } from '../db';
import { enderecos } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// Todos os endpoints de endereço exigem autenticação
router.use(authMiddleware);

// Função auxiliar para validar ID
function validarId(id: string | string[] | undefined): string {
  if (!id || typeof id !== 'string') {
    throw new Error('ID inválido');
  }
  return id;
}

// GET /enderecos - Listar todos os endereços do usuário
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const resultados = await db.select().from(enderecos)
      .where(eq(enderecos.usuario_id, userId));

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar endereços' });
  }
});

// POST /enderecos - Criar um novo endereço
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const { 
      logradouro, numero, complemento, bairro, 
      cidade, estado, cep, pais, tipo 
    } = req.body;

    // Validação básica
    if (!logradouro || !numero || !bairro || !cidade || !estado || !cep) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: logradouro, numero, bairro, cidade, estado, cep' 
      });
    }

    const [novoEndereco] = await db.insert(enderecos).values({
      usuario_id: userId,
      logradouro,
      numero,
      complemento: complemento || null,
      bairro,
      cidade,
      estado,
      cep,
      pais: pais || 'Brasil',
      tipo: tipo || 'entrega',
    }).returning();

    res.status(201).json(novoEndereco);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar endereço' });
  }
});

// PUT /enderecos/:id - Atualizar um endereço
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const id = validarId(req.params.id);
    const { 
      logradouro, numero, complemento, bairro, 
      cidade, estado, cep, pais, tipo 
    } = req.body;

    // Verificar se o endereço pertence ao usuário
    const existente = await db.select().from(enderecos)
      .where(and(
        eq(enderecos.id, id),
        eq(enderecos.usuario_id, userId)
      ));

    if (existente.length === 0 || !existente[0]) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    const [enderecoAtualizado] = await db.update(enderecos)
      .set({
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        pais,
        tipo,
        updateAt: new Date(),
      })
      .where(eq(enderecos.id, id))
      .returning();

    res.json(enderecoAtualizado);
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ message: 'Erro ao atualizar endereço' });
  }
});

// DELETE /enderecos/:id - Deletar um endereço
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const id = validarId(req.params.id);

    // Verificar se o endereço pertence ao usuário
    const existente = await db.select().from(enderecos)
      .where(and(
        eq(enderecos.id, id),
        eq(enderecos.usuario_id, userId)
      ));

    if (existente.length === 0 || !existente[0]) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }

    await db.delete(enderecos).where(eq(enderecos.id, id));

    res.status(204).send();
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ message: 'Erro ao deletar endereço' });
  }
});

export default router;