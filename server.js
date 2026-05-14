require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {

    if (err) {

        console.log('Erro ao conectar no MySQL:', err);
        return;
    }

    console.log('MySQL conectado!');
});


// ==================== CADASTRO ====================

app.post('/cadastro', (req, res) => {

    const {
        usuario,
        email,
        endereco,
        telefone,
        senha
    } = req.body;

    const sql = `
        INSERT INTO usuarios
        (usuario, email, endereco, telefone, senha)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [usuario, email, endereco, telefone, senha],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.json({
                    sucesso: false,
                    erro: err
                });
            }

            res.json({
                sucesso: true
            });
        }
    );
});


// ==================== LOGIN ====================

app.post('/login', (req, res) => {

    const {
        usuario,
        senha
    } = req.body;

    const sql = `
        SELECT * FROM usuarios
        WHERE usuario = ?
        AND senha = ?
    `;

    db.query(
        sql,
        [usuario, senha],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.json({
                    sucesso: false
                });
            }

            if (results.length > 0) {

                res.json({
                    sucesso: true,
                    usuario: results[0]
                });

            } else {

                res.json({
                    sucesso: false
                });
            }
        }
    );
});


// ==================== CRIAR POST ====================

app.post('/posts', (req, res) => {

    const {
        usuario_id,
        categoria,
        titulo,
        descricao,
        endereco,
        horario,
        status
    } = req.body;

    const sql = `
        INSERT INTO posts
        (
            usuario_id,
            categoria,
            titulo,
            descricao,
            endereco,
            horario,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            usuario_id,
            categoria,
            titulo,
            descricao,
            endereco,
            horario,
            status
        ],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.json({
                    sucesso: false
                });
            }

            res.json({
                sucesso: true
            });
        }
    );
});


// ==================== LISTAR POSTS ====================

app.get('/posts', (req, res) => {

    const sql = `
        SELECT
            posts.*,
            usuarios.usuario
        FROM posts
        JOIN usuarios
        ON usuarios.id = posts.usuario_id
        ORDER BY posts.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(err);

            return res.json([]);
        }

        res.json(results);
    });
});


// ==================== TESTE ====================

app.get('/teste', (req, res) => {

    res.send('Servidor funcionando!');
});


// ==================== INICIAR SERVIDOR ====================

app.listen(process.env.PORT, () => {

    console.log(
        `Servidor rodando em http://localhost:${process.env.PORT}`
    );
});