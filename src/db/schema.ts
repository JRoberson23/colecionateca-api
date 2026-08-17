import { pgTable, uuid, varchar, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm';

// Tabela produtos
export const produtos = pgTable("produtos", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar("nome", { length: 255 }).notNull(),
    descricao: varchar("descricao", { length: 1000 }),
    preco: real("preco").notNull(),
    estoque: integer("estoque").notNull(),
    imagens: jsonb("imagens").default([]),
    categoria: varchar("categoria", { length: 50 }),
    metadata: jsonb("metadata"),
    destaque: boolean("destaque").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela usuarios
export const usuarios = pgTable("usuarios", {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    nome: varchar("nome", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    senha_hash: varchar("senha_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 50}).default("cliente"),
    email_verificado: boolean("email_verificado").default(false),
    token_verificacao: varchar("token_verificacao", { length: 255 }),
    token_expiracao: timestamp("token_expiracao"),
    reset_token: varchar("reset_token", { length: 255 }),
    reset_token_expires: timestamp("reset_token_expires"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de endereços
export const enderecos = pgTable("enderecos",{
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    usuario_id: uuid("usuario_id").notNull().references(() => usuarios.id, { onDelete: 'cascade'}),
    logradouro: varchar("logradouro", { length: 255}).notNull(),
    numero: varchar("numero", { length:20}).notNull(),
    complemento: varchar("complemento", {length: 100}),
    bairro: varchar("bairro", { length: 100 }).notNull(),
    cidade: varchar("cidade", { length: 100 }).notNull(),
    estado: varchar("estado", { length: 2 }).notNull(),
    cep: varchar("cep", { length: 10 }).notNull(),
    pais: varchar("pais", { length: 50 }).default('Brasil'),
    tipo: varchar("tipo", { length: 20 }).default('entrega'),
    createAt: timestamp("created_at").defaultNow().notNull(),
    updateAt: timestamp("updated_at").defaultNow(),
})

// Tabela: pedidos
export const pedidos = pgTable("pedidos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  usuario_id: uuid("usuario_id").notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  endereco_id: uuid("endereco_id").notNull().references(() => enderecos.id),
  status: varchar("status", { length: 50 }).default('pendente'),
  total: real("total").notNull(),
  frete: real("frete").default(0),
  metodo_pagamento: varchar("metodo_pagamento", { length: 50 }),
  data_pedido: timestamp("data_pedido").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela: itens_pedido
export const itensPedido = pgTable("itens_pedido", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pedido_id: uuid("pedido_id").notNull().references(() => pedidos.id, { onDelete: 'cascade' }),
  produto_id: uuid("produto_id").notNull().references(() => produtos.id),
  quantidade: integer("quantidade").notNull(),
  preco_unitario: real("preco_unitario").notNull(),
  subtotal: real("subtotal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});