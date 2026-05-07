// ==================== VARIÁVEIS GLOBAIS ====================
let usuarioLogado = null;
let postAtual = null;
let posts = [];
let currentTab = "lost";
let currentStatusFilter = "all";
let searchQuery = "";

// ==================== FUNÇÕES PRINCIPAIS ====================

// Função chamada ao clicar em "Entrar na Plataforma"
function solicitarLogin() {
    if (usuarioLogado) {
        // Se já está logado, vai direto para o feed
        mostrarFeed();
    } else {
        // Se não está logado, mostra o modal de login
        mostrarLoginPanel();
        document.getElementById("loginModal").style.display = "flex";
    }
}

// Função para criar conta a partir da landing page
function mostrarCadastroFromLanding() {
    mostrarCadastroPanel();
    document.getElementById("loginModal").style.display = "flex";
}

// Função para mostrar o feed (só funciona se estiver logado)
function mostrarFeed() {
    if (!usuarioLogado) {
        mostrarMensagem("Você precisa estar logado para acessar o feed!", "error");
        mostrarLoginPanel();
        document.getElementById("loginModal").style.display = "flex";
        return false;
    }
    
    // Esconde todas as telas
    document.getElementById("telaInicial").style.display = "none";
    document.getElementById("appRoot").style.display = "block";
    document.getElementById("detalhesPost").style.display = "none";
    
    // Renderiza o feed
    renderizarFeed();
    atualizarStats();
    return true;
}

function voltarParaHome() {
    document.getElementById("telaInicial").style.display = "flex";
    document.getElementById("appRoot").style.display = "none";
    document.getElementById("detalhesPost").style.display = "none";
}

function voltarParaFeed() {
    if (!usuarioLogado) {
        solicitarLogin();
        return;
    }
    document.getElementById("detalhesPost").style.display = "none";
    document.getElementById("appRoot").style.display = "block";
    renderizarFeed();
}

// ==================== VERIFICAÇÃO DE LOGIN ====================
function verificarLoginEAcao(acao) {
    if (!usuarioLogado) {
        mostrarMensagem(`Você precisa estar logado para ${acao}!`, "error");
        mostrarLoginPanel();
        document.getElementById("loginModal").style.display = "flex";
        return false;
    }
    return true;
}

// ==================== UTILITÁRIOS ====================
function toggleSenha(campoId, botao) {
    const campoSenha = document.getElementById(campoId);
    if (campoSenha.type === "password") {
        campoSenha.type = "text";
        botao.innerHTML = "🙈";
    } else {
        campoSenha.type = "password";
        botao.innerHTML = "👁️";
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function mostrarMensagem(texto, tipo = 'success') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `mensagem-flutuante ${tipo}`;
    msgDiv.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${texto}`;
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), 3000);
}

function atualizarPreviewStats() {
    const total = posts.length;
    const resolvidos = posts.filter(p => p.status === "resolvido").length;
    const previewTotal = document.getElementById("previewTotalItens");
    const previewResolvidos = document.getElementById("previewResolvidos");
    if (previewTotal) previewTotal.innerText = total;
    if (previewResolvidos) previewResolvidos.innerText = resolvidos;
}

// ==================== VALIDAÇÃO DE SENHA ====================
function validarSenha() {
    const senha = document.getElementById("cadPass").value;
    const btnCadastrar = document.getElementById("doCadastroBtn");
    
    const temMinimo = senha.length >= 6;
    const temMaiuscula = /[A-Z]/.test(senha);
    const temMinuscula = /[a-z]/.test(senha);
    const temNumero = /[0-9]/.test(senha);
    const temSemEspeciais = /^[a-zA-Z0-9]+$/.test(senha);
    
    const reqMinimo = document.getElementById("reqMinimo");
    const reqMaiuscula = document.getElementById("reqMaiuscula");
    const reqMinuscula = document.getElementById("reqMinuscula");
    const reqNumero = document.getElementById("reqNumero");
    const reqSemEspeciais = document.getElementById("reqSemEspeciais");
    
    if (reqMinimo) reqMinimo.innerHTML = temMinimo ? "✅" : "❌";
    if (reqMaiuscula) reqMaiuscula.innerHTML = temMaiuscula ? "✅" : "❌";
    if (reqMinuscula) reqMinuscula.innerHTML = temMinuscula ? "✅" : "❌";
    if (reqNumero) reqNumero.innerHTML = temNumero ? "✅" : "❌";
    if (reqSemEspeciais) reqSemEspeciais.innerHTML = temSemEspeciais ? "✅" : "❌";
    
    const senhaValida = temMinimo && temMaiuscula && temMinuscula && temNumero && temSemEspeciais;
    if (btnCadastrar) btnCadastrar.disabled = !senhaValida;
    return senhaValida;
}

// ==================== PERSISTÊNCIA DE DADOS ====================
function carregarDados() {
    const storedPosts = localStorage.getItem("posts_achados_perdidos");
    if (storedPosts) {
        posts = JSON.parse(storedPosts);
    } else {
        posts = [];
        salvarPosts();
    }
    atualizarPreviewStats();
}

function salvarPosts() {
    localStorage.setItem("posts_achados_perdidos", JSON.stringify(posts));
    atualizarPreviewStats();
}

// ==================== AUTENTICAÇÃO ====================
function cadastrar() {
    const user = document.getElementById("cadUser").value.trim();
    const email = document.getElementById("cadEmail").value.trim();
    const endereco = document.getElementById("cadEndereco").value.trim();
    const telefone = document.getElementById("cadTelefone").value.trim();
    const pass = document.getElementById("cadPass").value;
    
    if (!validarSenha()) {
        mostrarMensagem("Senha não atende aos requisitos!", "error");
        return;
    }
    
    if (!user || !email || !telefone || !pass) {
        mostrarMensagem("Preencha todos os campos obrigatórios!", "error");
        return;
    }
    
    if (localStorage.getItem(user)) {
        mostrarMensagem("Usuário já existe!", "error");
        return;
    }
    
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
        mostrarMensagem("WhatsApp inválido!", "error");
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarMensagem("Email inválido!", "error");
        return;
    }
    
    const usuario = {
        email: email,
        endereco: endereco,
        telefone: telefoneLimpo,
        senha: pass,
        dataCadastro: new Date().toISOString()
    };
    
    localStorage.setItem(user, JSON.stringify(usuario));
    mostrarMensagem("Cadastro realizado com sucesso! Faça login.");
    mostrarLoginPanel();
    document.getElementById("cadPass").value = "";
}

function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    
    if (!user || !pass) {
        mostrarMensagem("Preencha usuário e senha!", "error");
        return;
    }
    
    const dados = JSON.parse(localStorage.getItem(user));
    
    if (dados && dados.senha === pass) {
        usuarioLogado = user;
        localStorage.setItem("usuarioLogadoSession", user);
        document.getElementById("loginModal").style.display = "none";
        
        // Limpa os campos
        document.getElementById("loginUser").value = "";
        document.getElementById("loginPass").value = "";
        
        // Mostra o feed
        mostrarFeed();
        updateUI();
        mostrarMensagem(`Bem-vindo, ${user}!`);
    } else {
        mostrarMensagem("Usuário ou senha inválidos!", "error");
    }
}

function recuperarSenha() {
    const email = document.getElementById("recEmail").value.trim();
    
    if (!email) {
        mostrarMensagem("Digite seu email!", "error");
        return;
    }
    
    let encontrou = false;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === "posts_achados_perdidos" || key === "usuarioLogadoSession") continue;
        
        const dados = JSON.parse(localStorage.getItem(key));
        if (dados && dados.email === email) {
            mostrarMensagem(`Sua senha é: ${dados.senha}`, "success");
            encontrou = true;
            mostrarLoginPanel();
            break;
        }
    }
    
    if (!encontrou) {
        mostrarMensagem("Email não encontrado!", "error");
    }
}

function logout() {
    if (confirm("Deseja sair?")) {
        usuarioLogado = null;
        localStorage.removeItem("usuarioLogadoSession");
        
        // Volta para a tela inicial
        document.getElementById("appRoot").style.display = "none";
        document.getElementById("detalhesPost").style.display = "none";
        document.getElementById("telaInicial").style.display = "flex";
        
        updateUI();
        mostrarMensagem("Logout realizado com sucesso!");
    }
}

// ==================== CRUD DE POSTS ====================
function criarPost() {
    if (!verificarLoginEAcao("publicar um post")) return;
    
    const titulo = document.getElementById("postTitulo").value.trim();
    const descricao = document.getElementById("postDescricao").value.trim();
    const endereco = document.getElementById("postEndereco").value.trim();
    const categoria = document.getElementById("postCategoria").value;
    const horario = document.getElementById("postHorario").value;
    const status = document.getElementById("postStatus").value;
    const arquivo = document.getElementById("postMidia").files[0];
    
    if (!titulo || !descricao || !endereco) {
        mostrarMensagem("Preencha título, descrição e endereço!", "error");
        return;
    }
    
    let midiaTipo = null;
    let midiaURL = null;
    
    if (arquivo) {
        midiaTipo = arquivo.type.startsWith('image/') ? 'imagem' : 'video';
        midiaURL = URL.createObjectURL(arquivo);
    }
    
    const novoPost = {
        id: Date.now(),
        usuario: usuarioLogado,
        categoria: categoria,
        titulo: titulo,
        descricao: descricao,
        endereco: endereco,
        horario: horario || new Date().toISOString().slice(0, 16),
        status: status,
        midiaTipo: midiaTipo,
        midiaURL: midiaURL,
        dataPublicacao: new Date().toLocaleString('pt-BR'),
        comentarios: []
    };
    
    posts.unshift(novoPost);
    salvarPosts();
    document.getElementById("postModal").style.display = "none";
    renderizarFeed();
    atualizarStats();
    mostrarMensagem("Post publicado com sucesso!");
    
    // Limpa o formulário
    document.getElementById("postTitulo").value = "";
    document.getElementById("postDescricao").value = "";
    document.getElementById("postEndereco").value = "";
    document.getElementById("postHorario").value = "";
    document.getElementById("postMidia").value = "";
}

function deletarPost(postId) {
    if (!verificarLoginEAcao("deletar um post")) return;
    
    const post = posts.find(p => p.id === postId);
    if (post && post.usuario !== usuarioLogado) {
        mostrarMensagem("Você só pode deletar seus próprios posts!", "error");
        return;
    }
    
    if (confirm("Deletar este post? Todos os comentários serão removidos!")) {
        posts = posts.filter(post => post.id !== postId);
        salvarPosts();
        if (postAtual && postAtual.id === postId) {
            voltarParaFeed();
        }
        renderizarFeed();
        atualizarStats();
        mostrarMensagem("Post deletado!");
    }
}

// ==================== COMENTÁRIOS ====================
function adicionarComentario() {
    if (!verificarLoginEAcao("comentar")) return;
    
    const textoComentario = document.getElementById("comentarioTexto").value.trim();
    const fileInput = document.getElementById("comentarioFoto");
    const file = fileInput.files[0];
    
    if (!textoComentario) {
        mostrarMensagem("Digite um comentário!", "error");
        return;
    }
    
    const processarComentario = (fotoUrl = null) => {
        const novoComentario = {
            id: Date.now(),
            usuario: usuarioLogado,
            texto: textoComentario,
            fotoUrl: fotoUrl,
            data: new Date().toLocaleString('pt-BR'),
            likes: 0,
            deslikes: 0,
            avaliacoes: {},
            respostas: []
        };
        
        const postIndex = posts.findIndex(p => p.id === postAtual.id);
        if (postIndex !== -1) {
            if (!posts[postIndex].comentarios) posts[postIndex].comentarios = [];
            posts[postIndex].comentarios.push(novoComentario);
            salvarPosts();
            postAtual = posts[postIndex];
            document.getElementById("comentarioTexto").value = "";
            document.getElementById("comentarioFoto").value = "";
            carregarComentariosDetalhe();
            renderizarFeed();
            atualizarStats();
            mostrarMensagem("Comentário adicionado!");
        }
    };
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            processarComentario(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        processarComentario(null);
    }
}

function carregarComentariosDetalhe() {
    const container = document.getElementById("listaComentariosDetalhe");
    if (!container) return;
    
    if (!postAtual || !postAtual.comentarios || postAtual.comentarios.length === 0) {
        container.innerHTML = "<p><em>Nenhum comentário ainda. Seja o primeiro!</em></p>";
        return;
    }
    
    container.innerHTML = "";
    postAtual.comentarios.forEach(comentario => {
        const div = document.createElement("div");
        div.className = "comentario-card";
        
        const podeDeletar = comentario.usuario === usuarioLogado;
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <strong><i class="fas fa-user"></i> ${escapeHtml(comentario.usuario)}</strong>
                <small>📅 ${comentario.data}</small>
            </div>
            <p style="margin:8px 0;">${escapeHtml(comentario.texto)}</p>
            ${comentario.fotoUrl ? `<img src="${comentario.fotoUrl}" class="comment-img" style="max-width:100px; border-radius:8px; margin-top:8px;">` : ''}
            <div style="display:flex; gap:10px; margin-top:8px;">
                <button class="btn-avaliacao" onclick="avaliarComentario(${comentario.id}, 'like')">👍 ${comentario.likes || 0}</button>
                <button class="btn-avaliacao" onclick="avaliarComentario(${comentario.id}, 'deslike')">👎 ${comentario.deslikes || 0}</button>
                ${podeDeletar ? `<button class="btn-avaliacao" style="color:#dc3545;" onclick="deletarComentario(${comentario.id})">🗑️ Deletar</button>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function avaliarComentario(comentarioId, tipo) {
    if (!verificarLoginEAcao("avaliar comentários")) return;
    
    const postIndex = posts.findIndex(p => p.id === postAtual.id);
    if (postIndex !== -1) {
        const comentarioIndex = posts[postIndex].comentarios.findIndex(c => c.id === comentarioId);
        if (comentarioIndex !== -1) {
            const comentario = posts[postIndex].comentarios[comentarioIndex];
            const avaliacaoAtual = comentario.avaliacoes[usuarioLogado];
            
            if (tipo === 'like') {
                if (avaliacaoAtual === 'like') {
                    comentario.likes--;
                    delete comentario.avaliacoes[usuarioLogado];
                } else {
                    if (avaliacaoAtual === 'deslike') comentario.deslikes--;
                    comentario.likes++;
                    comentario.avaliacoes[usuarioLogado] = 'like';
                }
            } else if (tipo === 'deslike') {
                if (avaliacaoAtual === 'deslike') {
                    comentario.deslikes--;
                    delete comentario.avaliacoes[usuarioLogado];
                } else {
                    if (avaliacaoAtual === 'like') comentario.likes--;
                    comentario.deslikes++;
                    comentario.avaliacoes[usuarioLogado] = 'deslike';
                }
            }
            
            salvarPosts();
            postAtual = posts[postIndex];
            carregarComentariosDetalhe();
        }
    }
}

function deletarComentario(comentarioId) {
    if (!verificarLoginEAcao("deletar comentários")) return;
    
    const postIndex = posts.findIndex(p => p.id === postAtual.id);
    if (postIndex !== -1) {
        const comentarioIndex = posts[postIndex].comentarios.findIndex(c => c.id === comentarioId);
        if (comentarioIndex !== -1) {
            const comentario = posts[postIndex].comentarios[comentarioIndex];
            if (comentario.usuario === usuarioLogado) {
                posts[postIndex].comentarios.splice(comentarioIndex, 1);
                salvarPosts();
                postAtual = posts[postIndex];
                carregarComentariosDetalhe();
                renderizarFeed();
                atualizarStats();
                mostrarMensagem("Comentário removido!");
            } else {
                mostrarMensagem("Você só pode deletar seus próprios comentários!", "error");
            }
        }
    }
}

// ==================== FEED E FILTROS ====================
function getFilteredPosts() {
    let filtered = posts.filter(p => p.categoria === currentTab);
    if (currentStatusFilter !== "all") filtered = filtered.filter(p => p.status === currentStatusFilter);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.titulo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q));
    }
    return filtered;
}

function renderizarFeed() {
    if (!usuarioLogado) return;
    
    const container = document.getElementById("postsContainer");
    if (!container) return;
    
    const filtered = getFilteredPosts();
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open" style="font-size:3rem;"></i><p>Nenhum item encontrado. Publique algo novo!</p></div>`;
        return;
    }
    
    container.innerHTML = "";
    filtered.forEach(post => {
        const card = document.createElement("div");
        card.className = "card";
        
        let midiaPreview = "";
        if (post.midiaURL && post.midiaTipo === "imagem") {
            midiaPreview = `<img src="${post.midiaURL}" class="card-img" style="object-fit:cover;">`;
        } else if (post.midiaURL && post.midiaTipo === "video") {
            midiaPreview = `<video class="card-img" controls><source src="${post.midiaURL}"></video>`;
        } else {
            midiaPreview = `<div class="card-img"><i class="fas fa-image"></i></div>`;
        }
        
        const statusClass = post.status === "aberto" ? "status-open" : "status-resolved";
        const statusIcon = post.status === "aberto" ? "fa-hourglass-half" : "fa-check-circle";
        
        card.innerHTML = `
            ${midiaPreview}
            <div class="card-content">
                <div class="badge-row">
                    <span class="status-badge ${statusClass}"><i class="fas ${statusIcon}"></i> ${post.status === "aberto" ? "Aberto" : "Resolvido"}</span>
                    <small><i class="fas fa-comment-dots"></i> ${post.comentarios?.length || 0}</small>
                </div>
                <div class="card-title">${escapeHtml(post.titulo)}</div>
                <div class="card-desc">${escapeHtml(post.descricao.substring(0, 80))}${post.descricao.length > 80 ? '...' : ''}</div>
                <div class="card-meta"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(post.endereco)} • ${post.horario?.replace('T', ' ')}</div>
                <small style="color:#7c3aed;">👤 ${escapeHtml(post.usuario)}</small>
            </div>
        `;
        
        card.addEventListener("click", (e) => {
            e.stopPropagation();
            abrirDetalhesPost(post.id);
        });
        container.appendChild(card);
    });
    atualizarStats();
}

function abrirDetalhesPost(postId) {
    if (!verificarLoginEAcao("ver detalhes do post")) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    postAtual = post;
    document.getElementById("appRoot").style.display = "none";
    document.getElementById("detalhesPost").style.display = "block";
    
    const dadosAutor = JSON.parse(localStorage.getItem(post.usuario));
    const telefone = dadosAutor?.telefone || "";
    
    let midiaHtml = "";
    if (post.midiaURL && post.midiaTipo === "imagem") {
        midiaHtml = `<div><img src="${post.midiaURL}" style="max-width:100%; max-height:350px; border-radius:1rem; margin-top:10px;"></div>`;
    } else if (post.midiaURL && post.midiaTipo === "video") {
        midiaHtml = `<div><video controls style="max-width:100%;"><source src="${post.midiaURL}"></video></div>`;
    }
    
    const whatsLink = telefone ? `<a href="https://wa.me/55${telefone.replace(/\D/g, '')}" target="_blank" class="whatsapp-btn"><i class="fab fa-whatsapp"></i> Falar com autor via WhatsApp</a>` : "";
    const isOwner = (usuarioLogado === post.usuario);
    const statusText = post.status === 'aberto' ? '🟡 Aberto' : '✅ Resolvido';
    
    document.getElementById("conteudoPostDetalhe").innerHTML = `
        <div style="border-left:6px solid ${post.categoria === 'lost' ? '#ff6b6b' : '#4CAF50'}; padding-left:1rem;">
            <h2>${escapeHtml(post.titulo)}</h2>
            <p><strong>📝 Descrição:</strong> ${escapeHtml(post.descricao)}</p>
            <p><strong>📍 Local:</strong> ${escapeHtml(post.endereco)}</p>
            <p><strong>⏰ Data/Hora:</strong> ${post.horario?.replace('T', ' às ') || 'Não informado'}</p>
            <p><strong>👤 Publicado por:</strong> ${escapeHtml(post.usuario)}</p>
            <p><strong>📅 Publicado em:</strong> ${post.dataPublicacao}</p>
            <p><strong>Status:</strong> ${statusText}</p>
            ${isOwner ? `
                <div>
                    <label>Alterar Status:</label>
                    <select id="statusSelectDetalhe" style="width:auto; margin:10px 0;">
                        <option value="aberto" ${post.status === 'aberto' ? 'selected' : ''}>🟡 Aberto</option>
                        <option value="resolvido" ${post.status === 'resolvido' ? 'selected' : ''}>✅ Resolvido</option>
                    </select>
                </div>
            ` : ''}
            ${midiaHtml}
            ${whatsLink}
            ${isOwner ? `<button class="btn btn-danger" id="deletePostBtn" style="margin-top:10px;"><i class="fas fa-trash-alt"></i> Deletar Post</button>` : ''}
        </div>
    `;
    
    if (isOwner) {
        const sel = document.getElementById("statusSelectDetalhe");
        if (sel) {
            sel.addEventListener("change", (e) => {
                post.status = e.target.value;
                salvarPosts();
                abrirDetalhesPost(post.id);
                renderizarFeed();
                atualizarStats();
                mostrarMensagem("Status atualizado!");
            });
        }
        const delBtn = document.getElementById("deletePostBtn");
        if (delBtn) delBtn.onclick = () => deletarPost(post.id);
    }
    
    carregarComentariosDetalhe();
}

// ==================== UI E STATS ====================
function atualizarStats() {
    const total = posts.length;
    const resolvidos = posts.filter(p => p.status === "resolvido").length;
    const totalComent = posts.reduce((acc, p) => acc + (p.comentarios?.length || 0), 0);
    
    const totalItens = document.getElementById("totalItens");
    const totalResolvidos = document.getElementById("totalResolvidos");
    const totalComentarios = document.getElementById("totalComentarios");
    
    if (totalItens) totalItens.innerText = total;
    if (totalResolvidos) totalResolvidos.innerText = resolvidos;
    if (totalComentarios) totalComentarios.innerText = totalComent;
}

function updateUI() {
    const userSpan = document.getElementById("userStatusText");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const newPostBtn = document.getElementById("newPostBtn");
    
    if (usuarioLogado) {
        if (userSpan) userSpan.innerHTML = `<i class="fas fa-user-check"></i> ${usuarioLogado}`;
        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (newPostBtn) newPostBtn.style.display = "inline-block";
    } else {
        if (userSpan) userSpan.innerHTML = `<i class="fas fa-user-lock"></i> Deslogado`;
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (newPostBtn) newPostBtn.style.display = "none";
    }
}

// ==================== NAVEGAÇÃO DE MODAIS ====================
function mostrarLoginPanel() {
    const loginPanel = document.getElementById("loginPanel");
    const cadastroPanel = document.getElementById("cadastroPanel");
    const recuperarPanel = document.getElementById("recuperarPanel");
    if (loginPanel) loginPanel.style.display = "block";
    if (cadastroPanel) cadastroPanel.style.display = "none";
    if (recuperarPanel) recuperarPanel.style.display = "none";
}

function mostrarCadastroPanel() {
    const loginPanel = document.getElementById("loginPanel");
    const cadastroPanel = document.getElementById("cadastroPanel");
    const recuperarPanel = document.getElementById("recuperarPanel");
    if (loginPanel) loginPanel.style.display = "none";
    if (cadastroPanel) cadastroPanel.style.display = "block";
    if (recuperarPanel) recuperarPanel.style.display = "none";
}

function mostrarRecuperarPanel() {
    const loginPanel = document.getElementById("loginPanel");
    const cadastroPanel = document.getElementById("cadastroPanel");
    const recuperarPanel = document.getElementById("recuperarPanel");
    if (loginPanel) loginPanel.style.display = "none";
    if (cadastroPanel) cadastroPanel.style.display = "none";
    if (recuperarPanel) recuperarPanel.style.display = "block";
}

// ==================== INICIALIZAÇÃO ====================
function inicializarDemo() {
    if (!localStorage.getItem("posts_achados_perdidos")) {
        const postsDemo = [
            {
                id: 1,
                usuario: "sistema",
                categoria: "lost",
                titulo: "Cachorro Caramelo Perdido",
                descricao: "Cachorro de porte médio, cor caramelo, muito dócil. Atende pelo nome 'Bob'.",
                endereco: "Rua das Flores, 123 - Centro",
                horario: "2024-12-10T14:30",
                status: "aberto",
                midiaTipo: null,
                midiaURL: null,
                dataPublicacao: new Date().toLocaleString('pt-BR'),
                comentarios: []
            },
            {
                id: 2,
                usuario: "sistema",
                categoria: "found",
                titulo: "Chave encontrada",
                descricao: "Chave com chaveiro de pelúcia encontrada no parque central.",
                endereco: "Parque Central - Próximo ao banco",
                horario: "2024-12-11T09:00",
                status: "aberto",
                midiaTipo: null,
                midiaURL: null,
                dataPublicacao: new Date().toLocaleString('pt-BR'),
                comentarios: []
            }
        ];
        localStorage.setItem("posts_achados_perdidos", JSON.stringify(postsDemo));
    }
}

window.onload = () => {
    carregarDados();
    inicializarDemo();
    
    const sessionUser = localStorage.getItem("usuarioLogadoSession");
    if (sessionUser && JSON.parse(localStorage.getItem(sessionUser))) {
        usuarioLogado = sessionUser;
    }
    
    // Mostrar tela inicial primeiro
    document.getElementById("telaInicial").style.display = "flex";
    document.getElementById("appRoot").style.display = "none";
    document.getElementById("detalhesPost").style.display = "none";
    
    atualizarPreviewStats();
    
    // Se já estiver logado, atualiza a UI
    if (usuarioLogado) {
        updateUI();
    }
    
    // ========== EVENT LISTENERS ==========
    
    // Botões da landing page
    const entrarBtn = document.getElementById("entrarPlataformaBtn");
    if (entrarBtn) entrarBtn.onclick = solicitarLogin;
    
    const criarBtn = document.getElementById("criarContaLandingBtn");
    if (criarBtn) criarBtn.onclick = mostrarCadastroFromLanding;
    
    // Botões da navbar
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) loginBtn.onclick = () => { mostrarLoginPanel(); document.getElementById("loginModal").style.display = "flex"; };
    
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.onclick = logout;
    
    // Botão novo post
    const newPostBtn = document.getElementById("newPostBtn");
    if (newPostBtn) newPostBtn.onclick = () => {
        if (usuarioLogado) {
            document.getElementById("postModal").style.display = "flex";
        } else {
            mostrarMensagem("Faça login primeiro!", "error");
            solicitarLogin();
        }
    };
    
    // Modal de post
    const closePostModalBtn = document.getElementById("closePostModalBtn");
    if (closePostModalBtn) closePostModalBtn.onclick = () => document.getElementById("postModal").style.display = "none";
    
    const savePostBtn = document.getElementById("savePostBtn");
    if (savePostBtn) savePostBtn.onclick = criarPost;
    
    // Botão voltar ao feed
    const backToFeedBtn = document.getElementById("backToFeedBtn");
    if (backToFeedBtn) backToFeedBtn.onclick = voltarParaFeed;
    
    // Botão enviar comentário
    const enviarComentarioBtn = document.getElementById("enviarComentarioBtn");
    if (enviarComentarioBtn) enviarComentarioBtn.onclick = adicionarComentario;
    
    // Links dos modais
    const showCadastroLink = document.getElementById("showCadastroLink");
    if (showCadastroLink) showCadastroLink.onclick = (e) => { e.preventDefault(); mostrarCadastroPanel(); };
    
    const showRecuperarLink = document.getElementById("showRecuperarLink");
    if (showRecuperarLink) showRecuperarLink.onclick = (e) => { e.preventDefault(); mostrarRecuperarPanel(); };
    
    const voltarLoginCadastro = document.getElementById("voltarLoginCadastro");
    if (voltarLoginCadastro) voltarLoginCadastro.onclick = (e) => { e.preventDefault(); mostrarLoginPanel(); };
    
    const voltarLoginRecuperar = document.getElementById("voltarLoginRecuperar");
    if (voltarLoginRecuperar) voltarLoginRecuperar.onclick = (e) => { e.preventDefault(); mostrarLoginPanel(); };
    
    // Botões de autenticação
    const doLoginBtn = document.getElementById("doLoginBtn");
    if (doLoginBtn) doLoginBtn.onclick = login;
    
    const doCadastroBtn = document.getElementById("doCadastroBtn");
    if (doCadastroBtn) doCadastroBtn.onclick = cadastrar;
    
    const doRecuperarBtn = document.getElementById("doRecuperarBtn");
    if (doRecuperarBtn) doRecuperarBtn.onclick = recuperarSenha;
    
    // Busca
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            if (document.getElementById("appRoot").style.display !== "none" && usuarioLogado) {
                renderizarFeed();
            }
        });
    }
    
    // Filtros de status
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active-filter"));
            btn.classList.add("active-filter");
            currentStatusFilter = btn.getAttribute("data-filter");
            if (document.getElementById("appRoot").style.display !== "none" && usuarioLogado) {
                renderizarFeed();
            }
        });
    });
    
    // Tabs
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTab = btn.getAttribute("data-tab");
            if (document.getElementById("appRoot").style.display !== "none" && usuarioLogado) {
                renderizarFeed();
            }
        });
    });
    
    // Fechar modal ao clicar fora
    window.onclick = (e) => {
        if (e.target.classList && e.target.classList.contains('modal')) {
            e.target.style.display = "none";
        }
    };
};

// ==================== FUNÇÕES DE INTERAÇÃO COM COMENTÁRIOS (RESPOSTAS) ====================

// Função para mostrar/esconder o formulário de resposta
function mostrarFormResposta(comentarioId) {
    const form = document.getElementById(`form_resposta_${comentarioId}`);
    if (form.style.display === "none" || form.style.display === "") {
        form.style.display = "block";
    } else {
        form.style.display = "none";
    }
}

function fecharFormResposta(comentarioId) {
    const form = document.getElementById(`form_resposta_${comentarioId}`);
    if (form) {
        form.style.display = "none";
        const textarea = document.getElementById(`resposta_texto_${comentarioId}`);
        if (textarea) textarea.value = "";
    }
}

// Função para adicionar uma resposta a um comentário
function adicionarResposta(comentarioId) {
    if (!verificarLoginEAcao("responder comentário")) return;
    
    const textoResposta = document.getElementById(`resposta_texto_${comentarioId}`).value.trim();
    
    if (!textoResposta) {
        mostrarMensagem("Digite uma resposta!", "error");
        return;
    }
    
    const novaResposta = {
        id: Date.now(),
        usuario: usuarioLogado,
        texto: textoResposta,
        data: new Date().toLocaleString('pt-BR'),
        likes: 0,
        deslikes: 0,
        avaliacoes: {}
    };
    
    const postIndex = posts.findIndex(p => p.id === postAtual.id);
    if (postIndex !== -1) {
        const comentarioIndex = posts[postIndex].comentarios.findIndex(c => c.id === comentarioId);
        if (comentarioIndex !== -1) {
            if (!posts[postIndex].comentarios[comentarioIndex].respostas) {
                posts[postIndex].comentarios[comentarioIndex].respostas = [];
            }
            posts[postIndex].comentarios[comentarioIndex].respostas.push(novaResposta);
            salvarPosts();
            postAtual = posts[postIndex];
            fecharFormResposta(comentarioId);
            carregarComentariosDetalhe();
            mostrarMensagem("Resposta adicionada!");
        }
    }
}

// Função para avaliar uma resposta (like/deslike)
function avaliarResposta(comentarioId, respostaId, tipo) {
    if (!verificarLoginEAcao("avaliar resposta")) return;
    
    const postIndex = posts.findIndex(p => p.id === postAtual.id);
    if (postIndex !== -1) {
        const comentarioIndex = posts[postIndex].comentarios.findIndex(c => c.id === comentarioId);
        if (comentarioIndex !== -1) {
            const respostaIndex = posts[postIndex].comentarios[comentarioIndex].respostas.findIndex(r => r.id === respostaId);
            if (respostaIndex !== -1) {
                const resposta = posts[postIndex].comentarios[comentarioIndex].respostas[respostaIndex];
                const avaliacaoAtual = resposta.avaliacoes[usuarioLogado];
                
                if (tipo === 'like') {
                    if (avaliacaoAtual === 'like') {
                        resposta.likes--;
                        delete resposta.avaliacoes[usuarioLogado];
                    } else {
                        if (avaliacaoAtual === 'deslike') resposta.deslikes--;
                        resposta.likes++;
                        resposta.avaliacoes[usuarioLogado] = 'like';
                    }
                } else if (tipo === 'deslike') {
                    if (avaliacaoAtual === 'deslike') {
                        resposta.deslikes--;
                        delete resposta.avaliacoes[usuarioLogado];
                    } else {
                        if (avaliacaoAtual === 'like') resposta.likes--;
                        resposta.deslikes++;
                        resposta.avaliacoes[usuarioLogado] = 'deslike';
                    }
                }
                
                salvarPosts();
                postAtual = posts[postIndex];
                carregarComentariosDetalhe();
            }
        }
    }
}

// Função para deletar uma resposta
function deletarResposta(comentarioId, respostaId) {
    if (!verificarLoginEAcao("deletar resposta")) return;
    
    const postIndex = posts.findIndex(p => p.id === postAtual.id);
    if (postIndex !== -1) {
        const comentarioIndex = posts[postIndex].comentarios.findIndex(c => c.id === comentarioId);
        if (comentarioIndex !== -1) {
            const respostaIndex = posts[postIndex].comentarios[comentarioIndex].respostas.findIndex(r => r.id === respostaId);
            if (respostaIndex !== -1) {
                const resposta = posts[postIndex].comentarios[comentarioIndex].respostas[respostaIndex];
                if (resposta.usuario === usuarioLogado) {
                    posts[postIndex].comentarios[comentarioIndex].respostas.splice(respostaIndex, 1);
                    salvarPosts();
                    postAtual = posts[postIndex];
                    carregarComentariosDetalhe();
                    mostrarMensagem("Resposta removida!");
                } else {
                    mostrarMensagem("Você só pode deletar suas próprias respostas!", "error");
                }
            }
        }
    }
}
