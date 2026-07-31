import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { calcularFrete } from "../services/frete";

const router = Router();

router.post(
  "/calcular",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { cepDestino, itens } = req.body;

      if (!cepDestino) {
        return res.status(400).json({
          message: "O CEP de destino é obrigatório.",
        });
      }

      if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({
          message: "É necessário enviar pelo menos um item.",
        });
      }

      const resultado = await calcularFrete(cepDestino, itens);

      return res.json(resultado);
    } catch (error) {
      const detalhes =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao calcular frete.";

      console.error("❌ Erro ao calcular frete:", detalhes);

      return res.status(502).json({
        message: "Não foi possível calcular o frete.",
        detalhes:
          process.env.NODE_ENV !== "production"
            ? detalhes
            : undefined,
      });
    }
  }
);

export default router;