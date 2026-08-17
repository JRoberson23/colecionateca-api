import cron from 'node-cron';
import axios from 'axios';

// Função para fazer o ping
async function pingBackend() {
    try {
        const url = process.env.API_URL || 'https://colecionateca-api.onrender.com'; // URL do backend
        const response = await axios.get(`${url}/`);
        console.log(`Ping realizado com sucesso às ${new Date().toLocaleDateString(`pt-BR`)} - Status: ${response.status}`);
    } catch (error) {
        console.error(`❌ Erro no ping às ${new Date().toLocaleDateString(`pt-BR`)}:`, error);
    }
}

// Agendar ping a cada 14 minutos (segunda a sexta, das 8h as 20h)
// Segunda a sexta, das 8h às 20h, a cada 14 minutos
// 0,14,28,42 minutos de cada hora, de segunda a sexta (1-5)
cron.schedule('0,14,28,42 8-20 * * 1-5', async () => {
    console.log(`⏰ Agendamento de ping iniciado às ${new Date().toLocaleDateString(`pt-BR`)}`);
    await pingBackend();
});

// Também pingar ao iniciar o servidor
cron.schedule(`*/10 * * * *`, async () => {
    console.log(`⏰ Ping inicial do servidor às ${new Date().toLocaleDateString(`pt-BR`)}`);
    await pingBackend();
});