export interface Produto {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    estoque: number;
    imagem?: string;
    categoria?: string;
    metadata?: {
        console?: string;
        ano?: number;
        autor?: string;
        editora?: string;
        fabricante?: string;
        altura?: string;
        [key: string]: any;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export class Produto {
    constructor(
        public id: string,
        public nome: string,
        public preco: number,
        public estoque: number,
        public descricao?: string,
        public imagem?: string,
        public categoria?: string,
        public metadata?: {
            console?: string;
            ano?: number;
            autor?: string;
            editora?: string;
            fabricante?: string;
            altura?: string;
            [key: string]: any;
        },
        public createdAt?: Date,
        public updatedAt?: Date
    ) {}

    // Método para verificar disponibilidade do produto
    estaDisponivel(quantidade: number): boolean {
        return this.estoque >= quantidade;
    }

    // Método para baixar estoque
    baixarEstoque(quantidade: number): void {
        if (!this.estaDisponivel(quantidade)) {
            throw new Error('Estoque insuficiente');
        }
        this.estoque -= quantidade;
    }
}