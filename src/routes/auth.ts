import { Router } from 'express';
import { db } from '../db';
import { usuarios } from '../db/schema';
import { Usuario } from '../models/Usuario';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { enviarEmailVerificacao, enviarEmailRecuperacao } from '../services/email';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

// Validação com Zod
const registerSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha } = registerSchema.parse(req.body);

    const existente = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email));

    if (existente.length > 0) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }

    const tokenVerificacao = randomUUID();
    const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const novoUsuario = await Usuario.criar(nome, email, senha);

    await db.insert(usuarios).values({
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      senha_hash: novoUsuario.senha_hash,
      role: novoUsuario.role,
      email_verificado: true,
      token_verificacao: tokenVerificacao,
      token_expiracao: expiracao,
    });

    try {
      await enviarEmailVerificacao(email, novoUsuario.nome, tokenVerificacao);
    } catch (error) {
      console.error("Erro ao enviar e-mail", error);
    }

    return res.status(201).json({
      message: "Usuário registrado com sucesso!",
      user: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        role: novoUsuario.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

// GET /auth/verify-email - Verificar e-mail
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token inválido" });
    }

    const resultado = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.token_verificacao, token));

    if (resultado.length === 0) {
      return res.status(400).json({ message: "Token inválido" });
    }

    const usuarioData = resultado[0];
    if (!usuarioData) {
      return res.status(400).json({ message: "Token inválido" });
    }

    if (
      usuarioData.token_expiracao &&
      new Date(usuarioData.token_expiracao) < new Date()
    ) {
      return res.status(400).json({
        message: "Token expirado. Solicite um novo link de verificação.",
      });
    }

    await db
      .update(usuarios)
      .set({
        email_verificado: true,
        token_verificacao: null,
        token_expiracao: null,
      })
      .where(eq(usuarios.id, usuarioData.id));

    return res.json({
      message: "E-mail verificado com sucesso! Agora você pode fazer login.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao verificar e-mail" });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios' });
        }

        const resultado = await db.select().from(usuarios).where(eq(usuarios.email, email));
        if (resultado.length === 0) {
            return res.status(400).json({ message: 'Email ou senha inválidos' });
        }

        const usuarioData = resultado[0] as {
            id: string;
            nome: string;
            email: string;
            senha_hash: string;
            role: string;
            email_verificado: boolean | null;
        };

        if (!usuarioData.email_verificado) {
            return res.status(403).json({
                message : 'Por favor, verifique seu e-mail antes de fazer login. Verifique sua caixa de spam'
            });
        }

        const usuario = new Usuario(
            usuarioData.id,
            usuarioData.nome,
            usuarioData.email,
            usuarioData.senha_hash,
            usuarioData.role,
        );

        const senhaValida = await usuario.verificarSenha(senha);
        if (!senhaValida) {
            return res.status(400).json({ message: 'Email ou senha inválidos' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, role: usuario.role },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: { 
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role 
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao realizar login' });
    }
});

// POST /auth/forgot-password - Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'E-mail é obrigatório' });
        }

        const resultado = await db.select().from(usuarios).where(eq(usuarios.email, email));
        if (resultado.length === 0) {
            return res.status(200).json({ 
                message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.' 
            });
        }

        // Verificar se o usuário existe
        const usuario = resultado[0];
        if (!usuario) {
            return res.status(200).json({ 
                message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.' 
            });
        }

        const resetToken = randomUUID();
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

        await db.update(usuarios)
            .set({
                reset_token: resetToken,
                reset_token_expires: resetTokenExpires,
            })
            .where(eq(usuarios.id, usuario.id));

        try {
            await enviarEmailRecuperacao(email, usuario.nome, resetToken);
        } catch (error) {
            console.error('Erro ao enviar e-mail de recuperação:', error);
        }

        res.status(200).json({
            message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao solicitar recuperação de senha' });
    }
});

// POST /auth/reset-password - Redefinir senha
router.post('/reset-password', async (req, res) => {
    try {
        const { token, novaSenha } = req.body;

        if (!token || !novaSenha) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const resultado = await db.select().from(usuarios)
            .where(eq(usuarios.reset_token, token));

        if (resultado.length === 0) {
            return res.status(400).json({ message: 'Token inválido' });
        }

        // Verificar se o usuário existe
        const usuario = resultado[0];
        if (!usuario) {
            return res.status(400).json({ message: 'Token inválido' });
        }

        if (usuario.reset_token_expires && new Date(usuario.reset_token_expires) < new Date()) {
            return res.status(400).json({ message: 'Token expirado. Solicite um novo link.' });
        }

        const senha_hash = await bcrypt.hash(novaSenha, 10);

        await db.update(usuarios)
            .set({
                senha_hash: senha_hash,
                reset_token: null,
                reset_token_expires: null,
                updatedAt: new Date(),
            })
            .where(eq(usuarios.id, usuario.id));

        res.json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao redefinir senha' });
    }
});

// PUT /auth/perfil - Atualizar perfil do usuário
router.put('/perfil', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        const { nome, email, senha_atual, nova_senha } = req.body;

        // Buscar usuário no banco
        const resultado = await db.select().from(usuarios).where(eq(usuarios.id, userId));
        if (resultado.length === 0 || !resultado[0]) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // 🔧 CORREÇÃO: Garantir que usuario existe
        const usuario = resultado[0];

        // Se for alterar a senha, verificar a senha atual
        if (nova_senha) {
            if (!senha_atual) {
                return res.status(400).json({ message: 'Senha atual é obrigatória para alterar a senha' });
            }

            const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash);
            if (!senhaValida) {
                return res.status(400).json({ message: 'Senha atual incorreta' });
            }

            const novaSenhaHash = await bcrypt.hash(nova_senha, 10);
            
            // Atualizar com nova senha
            await db.update(usuarios)
                .set({
                    nome: nome || usuario.nome,
                    email: email || usuario.email,
                    senha_hash: novaSenhaHash,
                    updatedAt: new Date(),
                })
                .where(eq(usuarios.id, userId));
        } else {
            // Atualizar apenas nome e email
            await db.update(usuarios)
                .set({
                    nome: nome || usuario.nome,
                    email: email || usuario.email,
                    updatedAt: new Date(),
                })
                .where(eq(usuarios.id, userId));
        }

        // Buscar dados atualizados
        const usuarioAtualizado = await db.select().from(usuarios).where(eq(usuarios.id, userId));
        
        // Garantir que o usuário atualizado existe
        if (!usuarioAtualizado || !usuarioAtualizado[0]) {
            return res.status(404).json({ message: 'Erro ao buscar dados atualizados' });
        }

        const userData = usuarioAtualizado[0];
        
        res.json({
            message: 'Perfil atualizado com sucesso!',
            user: {
                id: userData.id,
                nome: userData.nome,
                email: userData.email,
                role: userData.role,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
});

export default router;