import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import { db } from './db';
import { produtos } from './db/schema';
import { authMiddleware } from './middlewares/auth';
import produtosRoutes from './routes/produtos';
import pedidosRoutes from './routes/pedidos';
import  enderecosRoutes  from './routes/enderecos';
import checkoutRoutes from './routes/checkout';
import freteRoutes from './routes/frete';
import path from 'path';
import './services/ping';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/produtos', produtosRoutes);
app.use('/pedidos', authMiddleware, pedidosRoutes);
app.use('/enderecos', enderecosRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/frete', freteRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.get('/', (req, res) => {
  res.json({ message: 'API Colecionateca está no ar!' });
});

// Rota de teste para verificar a conexão com o banco de dados
app.get('/test-db', async (req, res) => {
  try {
    const all = await db.select().from(produtos);
    res.json({ message: 'Conexão OK', count: all.length, data: all });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao conectar ao banco de dados' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});