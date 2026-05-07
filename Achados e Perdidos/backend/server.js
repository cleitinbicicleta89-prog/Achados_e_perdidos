const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Middleware de autenticação
const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ erro: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// ==================== ROTAS DE USUÁRIO ====================

// Cadastro
app.post('/api/cadastro', async (req, res) => {
    const { username, email, endereco, telefone, senha } = req.body;
    
    if (!username || !email || !telefone || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios' });
    }
    
    try {
        // Verificar se usuário já existe
        const [existing] = await db.query('SELECT * FROM usuarios WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) {
            return res.status(400).json({ erro: 'Usuário ou email já existe' });
        }
        
        const senhaHash = await bcrypt.hash(senha, 10);
        
        const [result] = await db.query(
            'INSERT INTO usuarios (username, email, endereco, telefone, senha) VALUES (?, ?, ?, ?, ?)',
            [username, email, endereco || '', telefone, senhaHash]
        );
        
        res.status(201).json({ mensagem: 'Usuário criado com sucesso', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, senha } = req.body;
    
    try {
        const [users] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
        }
        
        const usuario = users[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
        }
        
        const token = jwt.sign(
            { id: usuario.id, username: usuario.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            usuario: {
                id: usuario.id,
                username: usuario.username,
                email: usuario.email,
                telefone: usuario.telefone
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});

// Recuperar senha
app.post('/api/recuperar-senha', async (req, res) => {
    const { email } = req.body;
    
    try {
        const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ erro: 'Email não encontrado' });
        }
        
        // Aqui você enviaria um email com a senha ou link de recuperação
        // Por enquanto, vamos retornar uma mensagem
        res.json({ mensagem: 'Email de recuperação enviado' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao recuperar senha' });
    }
});

// ==================== ROTAS DE POSTS ====================

// Criar post
app.post('/api/posts', autenticarToken, upload.single('midia'), async (req, res) => {
    const { titulo, descricao, categoria, endereco, horario, status } = req.body;
    const usuario_id = req.user.id;
    
    let midia_url = null;
    let midia_tipo = null;
    
    if (req.file) {
        midia_url = `/uploads/${req.file.filename}`;
        midia_tipo = req.file.mimetype.startsWith('image/') ? 'imagem' : 'video';
    }
    
    try {
        const [result] = await db.query(
            `INSERT INTO posts (usuario_id, titulo, descricao, categoria, endereco, horario, status, midia_url, midia_tipo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [usuario_id, titulo, descricao, categoria, endereco, horario, status, midia_url, midia_tipo]
        );
        
        res.status(201).json({ mensagem: 'Post criado', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao criar post' });
    }
});

// Buscar todos os posts
app.get('/api/posts', async (req, res) => {
    const { categoria, status, search, tab } = req.query;
    
    let query = `
        SELECT p.*, u.username as autor_nome, u.telefone as autor_telefone,
               (SELECT COUNT(*) FROM comentarios WHERE post_id = p.id) as total_comentarios
        FROM posts p
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE 1=1
    `;
    const params = [];
    
    if (categoria && categoria !== 'all') {
        query += ' AND p.categoria = ?';
        params.push(categoria);
    }
    
    if (status && status !== 'all') {
        query += ' AND p.status = ?';
        params.push(status);
    }
    
    if (search) {
        query += ' AND (p.titulo LIKE ? OR p.descricao LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY p.data_publicacao DESC';
    
    try {
        const [posts] = await db.query(query, params);
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar posts' });
    }
});

// Buscar post por ID
app.get('/api/posts/:id', async (req, res) => {
    try {
        const [posts] = await db.query(
            `SELECT p.*, u.username as autor_nome, u.telefone as autor_telefone
             FROM posts p
             JOIN usuarios u ON p.usuario_id = u.id
             WHERE p.id = ?`,
            [req.params.id]
        );
        
        if (posts.length === 0) {
            return res.status(404).json({ erro: 'Post não encontrado' });
        }
        
        // Buscar comentários
        const [comentarios] = await db.query(
            `SELECT c.*, u.username as autor_nome
             FROM comentarios c
             JOIN usuarios u ON c.usuario_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.data_criacao ASC`,
            [req.params.id]
        );
        
        res.json({ ...posts[0], comentarios });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar post' });
    }
});

// Atualizar post
app.put('/api/posts/:id', autenticarToken, async (req, res) => {
    const { status } = req.body;
    const postId = req.params.id;
    const usuarioId = req.user.id;
    
    try {
        const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [postId]);
        
        if (post.length === 0) {
            return res.status(404).json({ erro: 'Post não encontrado' });
        }
        
        if (post[0].usuario_id !== usuarioId) {
            return res.status(403).json({ erro: 'Você só pode editar seus próprios posts' });
        }
        
        await db.query('UPDATE posts SET status = ? WHERE id = ?', [status, postId]);
        
        res.json({ mensagem: 'Post atualizado' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao atualizar post' });
    }
});

// Deletar post
app.delete('/api/posts/:id', autenticarToken, async (req, res) => {
    const postId = req.params.id;
    const usuarioId = req.user.id;
    
    try {
        const [post] = await db.query('SELECT * FROM posts WHERE id = ?', [postId]);
        
        if (post.length === 0) {
            return res.status(404).json({ erro: 'Post não encontrado' });
        }
        
        if (post[0].usuario_id !== usuarioId) {
            return res.status(403).json({ erro: 'Você só pode deletar seus próprios posts' });
        }
        
        await db.query('DELETE FROM posts WHERE id = ?', [postId]);
        
        res.json({ mensagem: 'Post deletado' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao deletar post' });
    }
});

// ==================== ROTAS DE COMENTÁRIOS ====================

// Adicionar comentário
app.post('/api/comentarios', autenticarToken, upload.single('foto'), async (req, res) => {
    const { post_id, texto } = req.body;
    const usuario_id = req.user.id;
    let foto_url = null;
    
    if (req.file) {
        foto_url = `/uploads/${req.file.filename}`;
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO comentarios (post_id, usuario_id, texto, foto_url) VALUES (?, ?, ?, ?)',
            [post_id, usuario_id, texto, foto_url]
        );
        
        res.status(201).json({ mensagem: 'Comentário adicionado', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao adicionar comentário' });
    }
});

// Deletar comentário
app.delete('/api/comentarios/:id', autenticarToken, async (req, res) => {
    const comentarioId = req.params.id;
    const usuarioId = req.user.id;
    
    try {
        const [comentario] = await db.query('SELECT * FROM comentarios WHERE id = ?', [comentarioId]);
        
        if (comentario.length === 0) {
            return res.status(404).json({ erro: 'Comentário não encontrado' });
        }
        
        if (comentario[0].usuario_id !== usuarioId) {
            return res.status(403).json({ erro: 'Você só pode deletar seus próprios comentários' });
        }
        
        await db.query('DELETE FROM comentarios WHERE id = ?', [comentarioId]);
        
        res.json({ mensagem: 'Comentário deletado' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao deletar comentário' });
    }
});

// ==================== ROTAS DE ESTATÍSTICAS ====================

app.get('/api/stats', async (req, res) => {
    try {
        const [totalPosts] = await db.query('SELECT COUNT(*) as total FROM posts');
        const [resolvidos] = await db.query('SELECT COUNT(*) as total FROM posts WHERE status = "resolvido"');
        const [totalComentarios] = await db.query('SELECT COUNT(*) as total FROM comentarios');
        
        res.json({
            totalItens: totalPosts[0].total,
            resolvidos: resolvidos[0].total,
            totalComentarios: totalComentarios[0].total
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
