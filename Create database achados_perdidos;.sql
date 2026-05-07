Create database achados_perdidos;   
charset utf8mb4;
collate utf8mb4_general_ci;     

use achados_perdidos;   

create table usuarios (
    id int auto_increment primary key,
    nome varchar(255) not null,
    email varchar(255) not null unique,
    senha varchar(255) not null
);
create table post (
    id int auto_increment primary key,
    titulo varchar(255) not null,
    descricao text not null,
    data datetime not null,
    local varchar(255) not null,
    tipo enum('achado', 'perdido') not null,
    usuario_id int not null,
    foreign key (usuario_id) references usuarios(id)
);

create table comentarios (
    id int auto_increment primary key,
    conteudo text not null,
    data datetime not null,
    usuario_id int not null,
    post_id int not null,
    foreign key (usuario_id) references usuarios(id),
    foreign key (post_id) references post(id)
);

create table curtidas (
    id int auto_increment primary key,
    usuario_id int not null,
    post_id int not null,
    foreign key (usuario_id) references usuarios(id),
    foreign key (post_id) references post(id)
);  

create table mensagens (
    id int auto_increment primary key,
    conteudo text not null,
    data datetime not null,
    remetente_id int not null,
    destinatario_id int not null,
    foreign key (remetente_id) references usuarios(id),
    foreign key (destinatario_id) references usuarios(id)
);

create table notificacoes (
    id int auto_increment primary key,
    conteudo text not null,
    data datetime not null,
    usuario_id int not null,
    post_id int,
    tipo enum('comentario', 'curtida', 'mensagem') not null,
    foreign key (usuario_id) references usuarios(id),
    foreign key (post_id) references post(id)
);

create index idx_usuario_id on post(usuario_id);
create index idx_post_id on comentarios(post_id);
create index idx_post_id on curtidas(post_id);
create index idx_usuario_id on mensagens(remetente_id);
create index idx_usuario_id on mensagens(destinatario_id);
create index idx_usuario_id on notificacoes(usuario_id);
create index idx_post_id on notificacoes(post_id);
