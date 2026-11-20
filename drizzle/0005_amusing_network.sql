CREATE TABLE "avaliacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nota_geral" integer NOT NULL,
	"nota_navegacao" integer,
	"nota_design" integer,
	"nota_checkout" integer,
	"comentario" varchar(1000),
	"status" varchar(20) DEFAULT 'pendente' NOT NULL,
	"resposta_admin" varchar(1000),
	"respondido_em" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "avaliacoes_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;