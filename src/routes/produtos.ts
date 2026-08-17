import { Router } from 'express';
import { db } from '../db';
import { produtos } from '../db/schema';
import { eq } from 'drizzle-orm';
import { adminMiddleware } from '../middlewares/auth';
import { upload } from '../services/upload';
import path from 'path';
import { AuthRequest } from '../middlewares/auth';
import { uploadToCloudinary } from '../services/upload';

const router = Router();

// Função auxiliar para validar o ID
function validarID(id: string | string[] | undefined): string {
  if (!id || typeof id !== 'string') {
    throw new Error('ID inválido');
  }
  return id;
}

// LISTAR todos os produtos (GET /produtos) - com filtro por categoria
router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;
    
    if (categoria) {
      const all = await db.select().from(produtos).where(eq(produtos.categoria, categoria as string));
      res.json(all);
    } else {
      const all = await db.select().from(produtos);
      res.json(all);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar produtos' });
  }
});

// GET /produtos/destaque - Buscar produtos em destaque (ANTES do /:id!)
router.get('/destaque', async (req, res) => {
  try {
    console.log('🔍 Buscando produtos em destaque...');
    const destaque = await db.select().from(produtos).where(eq(produtos.destaque, true));
    console.log(`✅ ${destaque.length} produtos em destaque encontrados`);
    res.json(destaque);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos em destaque:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos em destaque' });
  }
});

// BUSCAR produto por ID (GET /produtos/:id) - DEPOIS do /destaque!
router.get('/:id', async (req, res) => {
  try {
    const id = validarID(req.params.id);
    const result = await db.select().from(produtos).where(eq(produtos.id, id));
    
    if (result.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ message: 'Erro ao buscar produto' });
  }
});

// ADMIN - CRIAR novo produto (POST /produtos)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { nome, descricao, preco, estoque, imagem, categoria, metadata } = req.body;
    
    if (!nome || preco === undefined || estoque === undefined) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: nome, preco, estoque' 
      });
    }
    
    const novoProduto = await db.insert(produtos).values({
      nome,
      descricao: descricao || null,
      preco,
      estoque,
      imagens: imagem || null,
      categoria: categoria || null,
      metadata: metadata || null,
      destaque: false,
    }).returning();

    res.status(201).json(novoProduto[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar produto' });
  }
});

// ADMIN - ATUALIZAR produto (PUT /produtos/:id)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const id = validarID(req.params.id);
    const { nome, descricao, preco, estoque, imagem, categoria, metadata, destaque } = req.body;

    const existente = await db.select().from(produtos).where(eq(produtos.id, id));
    if (existente.length === 0 || !existente[0]) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const produtoAtual = existente[0];

    const updated = await db.update(produtos)
      .set({
        nome: nome || produtoAtual.nome,
        descricao: descricao !== undefined ? descricao : produtoAtual.descricao,
        preco: preco || produtoAtual.preco,
        estoque: estoque !== undefined ? estoque : produtoAtual.estoque,
        imagens: imagem !== undefined ? imagem : produtoAtual.imagens,
        categoria: categoria !== undefined ? categoria : produtoAtual.categoria,
        metadata: metadata !== undefined ? metadata : produtoAtual.metadata,
        destaque: destaque !== undefined ? destaque : produtoAtual.destaque,
        updatedAt: new Date(),
      })
      .where(eq(produtos.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ message: 'Erro ao atualizar produto' });
  }
});

// ADMIN - DELETAR produto (DELETE /produtos/:id)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const id = validarID(req.params.id);

    const existente = await db.select().from(produtos).where(eq(produtos.id, id));
    if (existente.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    await db.delete(produtos).where(eq(produtos.id, id));
    res.status(204).send();
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ message: 'ID inválido' });
    }
    res.status(500).json({ message: 'Erro ao deletar produto' });
  }
});

// ADMIN - Upload de imagem (POST /produtos/upload)
router.post('/upload', adminMiddleware, upload.single('imagens'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
    }

    // Upload para o Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    res.json({
      message: 'Imagem enviada com sucesso!',
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Erro ao fazer upload da imagem' 
    });
  }
});

export default router;