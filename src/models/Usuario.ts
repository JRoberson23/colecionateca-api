import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export class Usuario {
    constructor(
        public id: string,
        public nome: string,
        public email: string,
        public senha_hash: string,
        public role: string = "cliente",
        public createdAt?: Date,
        public updatedAt?: Date
    ) {}

    // Verificar se a senha fornecida corresponde ao hash
    async verificarSenha(senha: string): Promise<boolean> {
        return bcrypt.compare(senha, this.senha_hash);
    }

    // Criar um novo usuário com senha hasheada
    static async criar(nome: string, email: string, senha: string): Promise<Usuario> {
        const senha_hash = await bcrypt.hash(senha, 10);
        return new Usuario(
            randomUUID(),
            nome,
            email,
            senha_hash,
            'cliente',
            new Date(),
            new Date()
        );
    }
}
