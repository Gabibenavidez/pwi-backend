// PROBLEMAS EN LINEA 74 Y 122
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bcrypt = require('bcrypt');
const validaciones = require('./validaciones');
const rutasHola = require('./rutas-hola');
//const { Router } = require('express');


app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');


app.use(express.urlencoded());
app.use(express.json());
app.use(session({secret: "secret session"}));


app.use(express.static('static'));

async function conectar() {
    await mongoose.connect("mongodb+srv://pwi:covid2020@cluster0-hkouh.gcp.mongodb.net/<dbname>?retryWrites=true&w=majority", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
    console.log("Conected to mongoose server method: mongodb - async-await");
};
conectar();

const UsuarioSchema = new mongoose.Schema({
    username: String,
    password: String
});

const ListaSchema = new mongoose.Schema({
    producto: String,
    marca: String,
    cantidad: String,
    creador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuarios'
    }
});

const UsuarioModel = mongoose.model("usuarios", UsuarioSchema);
const ListaProductosModel = mongoose.model("ListaProductos", ListaSchema);

async function InicializarUsuarios() {
    let usuarios = await UsuarioModel.find();
    if(usuarios.length==0) {
        await UsuarioModel.create({
            username: 'admin@admin.com',
            password: 'admin123'
        })
    }
};
InicializarUsuarios();
//muestro formulario de productos
app.get('/agregar', (req, res) => {
    if(!req.session.usuario_ok) {
        res.redirect('/signin');
        return;
    }
    res.render('formulario');
});
//recibe formulario de productos
app.post('/agregar', async (req, res) => {
        await ListaProductosModel.create({
            producto: req.body.producto,
            marca: req.body.marca,
            cantidad: req.body.cantidad,
            creador: req.session.usuario_id
        });
    res.redirect('/listaProductos');
});
//buscar


// --API--

// Lista
app.get('/api/ListasProductos', async (req, res) => {
    const listado = await ListaProductosModel.find().populate('creador');
    res.send(listado);
});
//obtener un producto
app.get('/api/ListasProductos/:id', async (req, res) => {
    const Unalista = await ListaProductosModel.findById(req.params.id).populate('creador');
    //Unalista.creador = await UsuarioModel.findById(Unalista.creador);
    res.send(Unalista);
});

//agregar un producto
app.post('/api/ListasProductos', async (req, res) => {
    let productoAgregado = await ListaProductosModel.create({
        producto: req.body.producto,
        marca: req.body.marca,
        cantidad: req.body.cantidad,
        creador: req.body.usuario_id
    });
    res.status(201).send(productoAgregado);
});
//borrar
app.delete('/api/ListasProductos/:id', async (req, res) => {
    await ListaProductosModel.findByIdAndRemove(req.params.id);
    res.status(204).send();
});
//actualizar
app.put('/api/ListasProductos/:id', async(req, res) => {
    let listaActualizada = await ListaProductosModel.findByIdAndUpdate(req.params.id, {
        producto: req.body.producto,
        marca: req.body.marca,
        cantidad: req.body.cantidad
     });
     res.status(200).send(listaActualizada);
});
// -----------FIN DE LAS APIS -----------
app.get('/ListaProductos', async (req, res) => {
    const listadoA = await ListaProductosModel.find({creador: req.session.usuario_id}).lean();
    if(!req.session.usuario_ok) {
        res.redirect('/signin');
        return;
    }
    res.render('listado', {listado: listadoA});
});

app.get('/', (req, res) => {
    res.redirect('/index');
});

app.get('/editar/:id', async (req, res) => {
    let listaProductos = await ListaProductosModel.findById(req.params.id).lean();
    res.render('formulario', {datos: listaProductos});
});

app.get('/borrar/:id', async (req, res) => {
    await ListaProductosModel.findByIdAndRemove(req.params.id);
    res.redirect('/ListaProductos');
});
//Actualizar datos de el listado
app.post('/editar/:id', async (req, res) => {
    await ListaProductosModel.findByIdAndUpdate(req.params.id, {
       producto: req.body.producto,
       marca: req.body.marca,
       cantidad: req.body.cantidad
    });
    res.redirect('/ListaProductos')
});
// Pagina login
app.post('/signin', async function(req, res) {
    // req.body.email / req.body.password
    // admin@mail.com
    // admin123
    // const usuario = await Usuario.find({email: req.body.email});
    const pasaValidacion = validaciones.validarLogin(req.body.email, req.body.password);
    //VALIDACIONES
    if(pasaValidacion==false) {
        res.render('signup');
        return;
    }
    const usuario = await UsuarioModel.findOne({username: req.body.email});
    if (!usuario) {
        // el usuario es incorrecto
        res.send('Usuario/password incorrecto');
        return;
    }
    const passwordDelFormulario = req.body.password;
    const passwordBaseDatos = usuario.password;
    if (bcrypt.compareSync(passwordDelFormulario, passwordBaseDatos)) {
            // usuario y password correcto
            req.session.usuario_ok = true;
            req.session.email = req.body.email;
            req.session.user_id = usuario._id; 
            res.render('Pagina_usuario');
        } else {
            // La contraseña no coincide
            res.send('Usuario/password incorrecto');
        }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/index');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/signin', (req, res) => {
    res.render('login');
});

app.post('/signup', async (req, res) => {
    const pasaValidacion = validaciones.validarRegistro(req.body.email, req.body.password);
    if(pasaValidacion==false) {
        res.render('signup');
        return;
    }
    const existe = await UsuarioModel.findOne({username: req.body.email});
    if(existe) {
        res.send('El usuario ya existe');
        return;
    }
    const encryptedPassword = await bcrypt.hash(req.body.password, 10);
    const nuevoUsuario = await UsuarioModel.create({
        username: req.body.email,
        password: encryptedPassword
    });
    res.redirect('signin');
});

/// llamar a las rutas 
//app.use('/hola', rutasHola);
app.get('/index', (req, res) => {
    res.render('index');
})
const port = process.env.PORT ? process.env.PORT : 3000;

app.listen(port, () => {
    console.log("app conected to http://localhost:" + port);
});