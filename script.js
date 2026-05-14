let usuarioLogado = null;
let posts = [];

// =========================
// MENSAGENS
// =========================

function mostrarMensagem(texto, tipo = "success") {

    alert(texto);
}

// =========================
// TOGGLE SENHA
// =========================

function toggleSenha(id, botao) {

    const campo =
        document.getElementById(id);

    if (campo.type === "password") {

        campo.type = "text";

        botao.innerHTML = "🙈";

    } else {

        campo.type = "password";

        botao.innerHTML = "👁️";
    }
}

// =========================
// VALIDAR SENHA
// =========================

function validarSenha() {

    const senha =
        document.getElementById("cadPass").value;

    const valido =
        senha.length >= 6;

    document.getElementById(
        "doCadastroBtn"
    ).disabled = !valido;
}

// =========================
// LOGIN MYSQL
// =========================

async function login() {

    const user =
        document.getElementById("loginUser").value.trim();

    const pass =
        document.getElementById("loginPass").value;

    if (!user || !pass) {

        mostrarMensagem(
            "Preencha usuário e senha!",
            "error"
        );

        return;
    }

    try {

        const resposta = await fetch('/login', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                usuario: user,
                senha: pass
            })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {

            usuarioLogado =
                dados.usuario.usuario;

            localStorage.setItem(
                "usuarioLogadoSession",
                usuarioLogado
            );

            localStorage.setItem(
                "usuarioId",
                dados.usuario.id
            );

            document.getElementById(
                "loginModal"
            ).style.display = "none";

            mostrarFeed();

            updateUI();

            carregarPostsBanco();

            mostrarMensagem(
                `Bem-vindo ${usuarioLogado}!`
            );

        } else {

            mostrarMensagem(
                "Usuário ou senha inválidos!",
                "error"
            );
        }

    } catch (erro) {

        console.log(erro);

        mostrarMensagem(
            "Erro ao conectar no servidor",
            "error"
        );
    }
}

// =========================
// CADASTRO MYSQL
// =========================

async function cadastrarUsuario() {

    const usuario =
        document.getElementById("cadUser")
        .value.trim();

    const email =
        document.getElementById("cadEmail")
        .value.trim();

    const endereco =
        document.getElementById("cadEndereco")
        .value.trim();

    const telefone =
        document.getElementById("cadTelefone")
        .value.trim();

    const senha =
        document.getElementById("cadPass")
        .value;

    if (
        !usuario ||
        !email ||
        !telefone ||
        !senha
    ) {

        mostrarMensagem(
            "Preencha os campos obrigatórios!",
            "error"
        );

        return;
    }

    try {

        const resposta = await fetch('/cadastro', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                usuario,
                email,
                endereco,
                telefone,
                senha
            })
        });

        const dados = await resposta.json();

        if (dados.sucesso) {

            mostrarMensagem(
                "Cadastro realizado!"
            );

            document.getElementById(
                "loginModal"
            ).style.display = "none";

        } else {

            mostrarMensagem(
                "Erro ao cadastrar",
                "error"
            );
        }

    } catch (erro) {

        console.log(erro);

        mostrarMensagem(
            "Erro no servidor",
            "error"
        );
    }
}

// =========================
// CRIAR POST MYSQL
// =========================

async function criarPost() {

    if (!verificarLoginEAcao(
        "publicar um post"
    )) return;

    const titulo =
        document.getElementById("postTitulo")
        .value.trim();

    const descricao =
        document.getElementById("postDescricao")
        .value.trim();

    const endereco =
        document.getElementById("postEndereco")
        .value.trim();

    const categoria =
        document.getElementById("postCategoria")
        .value;

    const horario =
        document.getElementById("postHorario")
        .value;

    const status =
        document.getElementById("postStatus")
        .value;

    if (
        !titulo ||
        !descricao ||
        !endereco
    ) {

        mostrarMensagem(
            "Preencha todos os campos!",
            "error"
        );

        return;
    }

    try {

        const resposta = await fetch('/posts', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                usuario_id:
                    localStorage.getItem(
                        "usuarioId"
                    ),

                categoria,
                titulo,
                descricao,
                endereco,
                horario,
                status
            })
        });

        const dados =
            await resposta.json();

        if (dados.sucesso) {

            mostrarMensagem(
                "Post publicado!"
            );

            document.getElementById(
                "postModal"
            ).style.display = "none";

            carregarPostsBanco();

        } else {

            mostrarMensagem(
                "Erro ao publicar",
                "error"
            );
        }

    } catch (erro) {

        console.log(erro);

        mostrarMensagem(
            "Erro no servidor",
            "error"
        );
    }
}

// =========================
// CARREGAR POSTS MYSQL
// =========================

async function carregarPostsBanco() {

    try {

        const resposta =
            await fetch('/posts');

        posts =
            await resposta.json();

        renderizarFeed();

        atualizarStats();

    } catch (erro) {

        console.log(erro);
    }
}

// =========================
// RENDER FEED
// =========================

function renderizarFeed() {

    const container =
        document.getElementById(
            "postsContainer"
        );

    container.innerHTML = "";

    if (posts.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum post encontrado
            </div>
        `;

        return;
    }

    posts.forEach(post => {

        container.innerHTML += `

        <div class="card">

            <div class="card-content">

                <h3 class="card-title">
                    ${post.titulo}
                </h3>

                <p class="card-desc">
                    ${post.descricao}
                </p>

                <div class="card-meta">
                    <span>
                        ${post.endereco}
                    </span>
                </div>

            </div>

        </div>
        `;
    });
}

// =========================
// STATS
// =========================

function atualizarStats() {

    document.getElementById(
        "totalItens"
    ).innerText = posts.length;

    document.getElementById(
        "previewTotalItens"
    ).innerText = posts.length;
}

// =========================
// UI
// =========================

function updateUI() {

    const texto =
        document.getElementById(
            "userStatusText"
        );

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    const newPostBtn =
        document.getElementById(
            "newPostBtn"
        );

    if (usuarioLogado) {

        texto.innerHTML =
            `👤 ${usuarioLogado}`;

        loginBtn.style.display =
            "none";

        logoutBtn.style.display =
            "block";

        newPostBtn.style.display =
            "block";

    } else {

        texto.innerHTML =
            "Deslogado";

        loginBtn.style.display =
            "block";

        logoutBtn.style.display =
            "none";

        newPostBtn.style.display =
            "none";
    }
}

// =========================
// MOSTRAR FEED
// =========================

function mostrarFeed() {

    document.getElementById(
        "telaInicial"
    ).style.display = "none";

    document.getElementById(
        "appRoot"
    ).style.display = "block";
}

// =========================
// LOGIN CHECK
// =========================

function verificarLoginEAcao() {

    if (!usuarioLogado) {

        mostrarMensagem(
            "Faça login primeiro!",
            "error"
        );

        return false;
    }

    return true;
}

// =========================
// LOGOUT
// =========================

function logout() {

    usuarioLogado = null;

    localStorage.removeItem(
        "usuarioLogadoSession"
    );

    localStorage.removeItem(
        "usuarioId"
    );

    updateUI();
}

// =========================
// EVENTOS
// =========================

document.getElementById(
    "doLoginBtn"
).addEventListener(
    "click",
    login
);

document.getElementById(
    "doCadastroBtn"
).addEventListener(
    "click",
    cadastrarUsuario
);

document.getElementById(
    "savePostBtn"
).addEventListener(
    "click",
    criarPost
);

document.getElementById(
    "loginBtn"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "loginModal"
        ).style.display = "flex";
    }
);

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    logout
);

document.getElementById(
    "newPostBtn"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "postModal"
        ).style.display = "flex";
    }
);

document.getElementById(
    "closePostModalBtn"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "postModal"
        ).style.display = "none";
    }
);

document.getElementById(
    "entrarPlataformaBtn"
).addEventListener(
    "click",
    () => {

        mostrarFeed();
    }
);

document.getElementById(
    "criarContaLandingBtn"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "loginModal"
        ).style.display = "flex";

        document.getElementById(
            "loginPanel"
        ).style.display = "none";

        document.getElementById(
            "cadastroPanel"
        ).style.display = "block";
    }
);

document.getElementById(
    "showCadastroLink"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "loginPanel"
        ).style.display = "none";

        document.getElementById(
            "cadastroPanel"
        ).style.display = "block";
    }
);

document.getElementById(
    "voltarLoginCadastro"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "loginPanel"
        ).style.display = "block";

        document.getElementById(
            "cadastroPanel"
        ).style.display = "none";
    }
);

// =========================
// WINDOW ONLOAD
// =========================

window.onload = function () {

    usuarioLogado =
        localStorage.getItem(
            "usuarioLogadoSession"
        );

    carregarPostsBanco();

    updateUI();
};