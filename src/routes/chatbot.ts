import { Router } from 'express';
import { SessionsClient } from '@google-cloud/dialogflow';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import path from 'path';

const router = Router();

// Cliente Dialogflow
const projectId = 'roberson-store-chatbot';

// Caminho para a chave de serviço
const keyFilePath = path.join(__dirname, '../config/dialogflow-key.json');

// Criar o cliente Dialogflow com autenticação
const sessionClient = new SessionsClient({
    keyFilename: keyFilePath,
});

// Rota para enviar mensagens para o Dialogflow
router.post('/mensagem', async (req, res) => {
    try {
        const { mensagem } = req.body;
        const sessionId = 'default-session';

        if (!mensagem) {
            return res.status(400).json({ message: 'Mensagem é obrigatória' });
        }

        // Caminho da sessão
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

        // Criar request para o Dialogflow
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: mensagem,
                    languageCode: 'pt-BR',
                },
            },
        };

        // Enviar para o Dialogflow
        const [response] = await sessionClient.detectIntent(request);

        // Pegar os dados da resposta
        const result = response.queryResult;
        const resposta = result?.fulfillmentText || 'Desculpe, não entendi sua mensagem.';
        const action = result?.action || '';
        const intent = result?.intent?.displayName || 'fallback';
        const parameters = result?.parameters?.fields || {};

        // Verificar se há links na resposta (para redirecionamento)
        let redirectUrl = null;
        if (action === 'redirect') {
            redirectUrl = parameters['url']?.stringValue || null;
        } else if (action === 'redirect.whatsapp') {
            redirectUrl = 'https://wa.me/5511950768793';
        } else if (action === 'redirect.contato') {
            redirectUrl = 'mailto:jroberson.junior@outlook.com';
        } else if (action === 'redirect.site') {
            redirectUrl = 'https://roberson-dev.vercel.app/';
        }

        // Retornar resposta completa
        return res.json({
            mensagem: resposta,
            action: action,
            intent: intent,
            parameters: parameters,
            redirectUrl: redirectUrl,
        });
    } catch (error) {
        console.error('Erro no chatbot:', error);
        res.status(500).json({ 
            message: '⚠️ Erro ao processar sua mensagem. Tente novamente mais tarde.',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
});

export default router;