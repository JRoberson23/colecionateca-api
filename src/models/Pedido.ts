import { randomUUID } from 'crypto';

export interface ItemPedido {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export class Pedido {
  constructor(
    public id: string,
    public usuario_id: string,
    public endereco_id: string,
    public itens: ItemPedido[],
    public total: number,
    public frete: number = 0,
    public status: string = 'pendente',
    public metodo_pagamento?: string,
    public data_pedido?: Date,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}

  // Calcular o total do pedido com base nos itens
  static calcularTotal(itens: ItemPedido[]): number {
    return itens.reduce((acc, item) => acc + item.subtotal, 0);
  }

  // Criar um novo pedido
  static criar(
    usuario_id: string,
    endereco_id: string,
    itens: ItemPedido[],
    frete: number = 0,
    metodo_pagamento?: string
  ): Pedido {
    const total = this.calcularTotal(itens);
    return new Pedido(
      randomUUID(),
      usuario_id,
      endereco_id,
      itens,
      total,
      frete,
      'pendente',
      metodo_pagamento,
      new Date(),
      new Date(),
      new Date()
    );
  }

  // Atualizar status do pedido
  atualizarStatus(novoStatus: string): void {
    this.status = novoStatus;
    this.updatedAt = new Date();
  }

  // Verificar se o pedido pode ser cancelado
  podeCancelar(): boolean {
    return ['pendente', 'processando'].includes(this.status);
  }
}