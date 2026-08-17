interface ProdutoFrete {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco?: number;
  peso?: number;
  altura?: number;
  largura?: number;
  comprimento?: number;
}

interface ServicoMelhorEnvio {
  id?: number;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: {
    id?: number;
    name?: string;
    picture?: string;
  };
  error?: string;
}

export async function calcularFrete(
  cepDestino: string,
  produtos: ProdutoFrete[]
) {
  const token = process.env.MELHOR_ENVIO_TOKEN;

  const baseUrl =
    process.env.MELHOR_ENVIO_BASE_URL?.replace(/\/$/, "") ||
    "https://sandbox.melhorenvio.com.br";

  if (!token) {
    throw new Error(
      "A variável MELHOR_ENVIO_TOKEN não foi configurada no backend."
    );
  }

  const cepLimpo = cepDestino.replace(/\D/g, "");

  if (cepLimpo.length !== 8) {
    throw new Error("O CEP de destino deve possuir 8 números.");
  }

  const payload = {
    from: {
      postal_code: "83881008",
    },
    to: {
      postal_code: cepLimpo,
    },
    products: produtos.map((item, index) => ({
      id: String(item.produto_id || index + 1),
      name: item.nome || `Produto ${index + 1}`,
      quantity: Number(item.quantidade) || 1,

      // Melhor Envio utiliza peso em kg e dimensões em cm.
      weight: Number(item.peso) || 0.5,
      height: Number(item.altura) || 10,
      width: Number(item.largura) || 20,
      length: Number(item.comprimento) || 30,

      insurance_value: Number(item.preco) || 0,
    })),
  };

  console.log("📦 Ambiente Melhor Envio:", baseUrl);
  console.log("📦 CEP destino:", cepLimpo);
  console.log("📦 Payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(
    `${baseUrl}/api/v2/me/shipment/calculate`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Colecionateca (contato@colecionateca.com)",
      },
      body: JSON.stringify(payload),
    }
  );

  const responseText = await response.text();

  console.log("📦 Status Melhor Envio:", response.status);
  console.log("📦 Resposta Melhor Envio:", responseText);

  let responseData: unknown;

  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    const detalhes =
      typeof responseData === "string"
        ? responseData
        : JSON.stringify(responseData);

    throw new Error(
      `Melhor Envio respondeu com status ${response.status}: ${detalhes}`
    );
  }

  if (!Array.isArray(responseData)) {
    throw new Error("O Melhor Envio retornou um formato inesperado.");
  }

  const opcoes = (responseData as ServicoMelhorEnvio[])
  .filter((servico) => {
    const preco =
      servico.custom_price ??
      servico.price;

    return (
      !servico.error &&
      preco !== undefined &&
      preco !== null &&
      Number(preco) > 0
    );
  })
  .map((servico) => ({
    id: servico.id,
    name: servico.name || "Entrega",
    price: Number(
      servico.custom_price ??
      servico.price ??
      0
    ),
    delivery_time: Number(
      servico.custom_delivery_time ??
      servico.delivery_time ??
      0
    ),
    company:
      servico.company?.name ||
      "Transportadora",
  }));

  if (opcoes.length === 0) {
    const erros = (responseData as ServicoMelhorEnvio[])
      .filter((servico) => servico.error)
      .map((servico) => `${servico.name || "Serviço"}: ${servico.error}`)
      .join(" | ");

    throw new Error(
      erros
        ? `Nenhuma opção de frete disponível. ${erros}`
        : "Nenhuma opção de frete foi encontrada."
    );
  }

  return opcoes;
}