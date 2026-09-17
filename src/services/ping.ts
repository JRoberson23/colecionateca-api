import cron from 'node-cron';
import axios from 'axios';

// Função para fazer o ping
async function pingBackend() {
    try {
        const url = process.env.API_URL || 'https://colecionateca-api.onrender.com';
        const response = await axios.get(`${url}/`);
        console.log(`✅ Ping OK às ${new Date().toLocaleString('pt-BR')} - Status: ${response.status}`);
    } catch (error) {
        console.error(`❌ Erro no ping:`, error);
    }
}

// ✅ APENAS seg-sex, das 8h às 20h, a cada 14 minutos
cron.schedule('0,14,28,42 8-20 * * 1-5', async () => {
    console.log(`⏰ Ping agendado (horário comercial)`);
    await pingBackend();
});

// ✅ Ping único ao iniciar (não recorrente!)
console.log('🚀 Serviço de ping iniciado (seg-sex, 8h-20h)');