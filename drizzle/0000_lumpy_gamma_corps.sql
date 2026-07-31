CREATE TABLE "enderecos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"logradouro" varchar(255) NOT NULL,
	"numero" varchar(20) NOT NULL,
	"complemento" varchar(100),
	"bairro" varchar(100) NOT NULL,
	"cidade" varchar(100) NOT NULL,
	"estado" varchar(2) NOT NULL,
	"cep" varchar(10) NOT NULL,
	"pais" varchar(50) DEFAULT 'Brasil',
	"tipo" varchar(20) DEFAULT 'entrega',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_unitario" real NOT NULL,
	"subtotal" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"endereco_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'pendente',
	"total" real NOT NULL,
	"frete" real DEFAULT 0,
	"metodo_pagamento" varchar(50),
	"data_pedido" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"console" varchar(100) NOT NULL,
	"ano" integer NOT NULL,
	"preco" real NOT NULL,
	"estoque" integer NOT NULL,
	"imagem" varchar(500),
	"descricao" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'cliente',
	"email_verificado" boolean DEFAULT false,
	"token_verificacao" varchar(255),
	"token_expiracao" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."enderecos"("id") ON DELETE no action ON UPDATE no action;