// Importações
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const colors = require('colors'); // Usando a biblioteca colors

// Função para baixar um arquivo (vídeo)
async function downloadFile(url, filepath) {
    const response = await axios({
        url,
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', () => resolve(filepath));
        writer.on('error', (e) => reject(e));
    });
}

// Função para exibir o status de loading
function displayLoading(filename) {
    console.log(`[📁 Reel] Baixando: ${filename}...`.yellow);
}

// Função para exibir o status de sucesso
function displaySuccess(filename) {
    console.log(`[✅ Sucesso] Arquivo salvo: ${filename}`.green);
}

(async () => {
    const ig = new IgApiClient();
    const username = 'willvasconceloscpp'; // Substitua pelo seu nome de usuário do Instagram
    const password = '86268432@Nea'; // Substitua pela sua senha do Instagram
    
    // URL do perfil do Instagram (definida diretamente no código)
    const profileUrl = 'https://www.instagram.com/fornecedoresexclusivos5/'; // Substitua pela URL do perfil desejado
    const profileUsername = profileUrl.split('/')[3];
    

    try {
        // Login no Instagram
        ig.state.generateDevice(username);
        await ig.account.login(username, password);
        console.log(`✅ Logado no Instagram como ${username}`.blue);

        // Obtém o ID do usuário do perfil
        const userId = await ig.user.getIdByUsername(profileUsername);
        console.log(`🔍 Acessando o perfil de @${profileUsername}...`.blue);

        // Cria uma pasta para salvar os arquivos
        const folderPath = path.join(__dirname, profileUsername);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        // Obtém o feed de posts do usuário
        const feed = ig.feed.user(userId);
        let posts = [];
        let page = 1;

        console.log('⏳ Carregando todas as publicações...'.blue);

        // Itera sobre todas as páginas de posts
        do {
            console.log(`📄 Carregando página ${page}...`.blue);
            const newPosts = await feed.items();
            posts = posts.concat(newPosts);
            page++;
        } while (feed.isMoreAvailable()); // Continua enquanto houver mais posts

        console.log(`✅ Total de publicações carregadas: ${posts.length}`.blue);

        // Itera sobre os posts e baixa apenas os Reels (vídeos)
        let reelCount = 0;
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];

            // Verifica se o post é um vídeo (Reel)
            if (post.video_versions) {
                const mediaUrl = post.video_versions[0].url;
                const filename = path.join(folderPath, `reel_${reelCount + 1}.mp4`);

                // Exibe o status de loading
                displayLoading(filename);

                try {
                    // Baixa o arquivo
                    await downloadFile(mediaUrl, filename);
                    // Exibe o status de sucesso
                    displaySuccess(filename);
                    reelCount++;
                } catch (error) {
                    console.log(`[❌ Erro] Falha ao baixar o Reel ${reelCount + 1}: ${error.message}`.red);
                }
            }
        }

        if (reelCount === 0) {
            console.log('⚠️ Nenhum Reel encontrado no perfil.'.yellow);
        } else {
            console.log(`✅ Total de Reels baixados: ${reelCount}`.blue);
        }
    } catch (error) {
        console.log(`[❌ Erro] Ocorreu um erro: ${error.message}`.red);
    }
})();